const { query } = require("../database/connection");
const logger = require("../utils/logger");

class DataSimulator {
  constructor() {
    this.io = null;
    this.isRunning = false;
    this.simulationInterval = null;
  }

  async start(io) {
    this.io = io;

    if (this.isRunning) {
      logger.warn("Data simulation is already running");
      return;
    }

    // Set interval to 5 seconds (5000ms)
    this.simulationInterval = setInterval(async () => {
      try {
        await this.generateSensorData();
      } catch (error) {
        logger.error("Data simulation error:", error);
      }
    }, 5000); // 5 seconds

    this.isRunning = true;
    logger.info("Data simulation started with 5-second interval");
  }

  stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    logger.info("Data simulation stopped");
  }

  async generateSensorData() {
    try {
      // Get all active ponds
      const pondsResult = await query(`
        SELECT 
          p.id, p.name, p.type, p.farm_id,
          sd.temperature as last_temperature,
          sd.ph_level as last_ph,
          sd.dissolved_oxygen as last_oxygen,
          sd.salinity as last_salinity,
          sd.turbidity as last_turbidity,
          sd.ammonia_level as last_ammonia,
          sd.nitrite_level as last_nitrite,
          sd.nitrate_level as last_nitrate
        FROM ponds p
        LEFT JOIN LATERAL (
          SELECT * FROM sensor_data 
          WHERE pond_id = p.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) sd ON true
        WHERE p.is_active = true
      `);

      for (const pond of pondsResult.rows) {
        const sensorReading = this.generateRealisticReading(pond);

        // Insert new sensor data
        const newReading = await query(
          `
          INSERT INTO sensor_data (
            pond_id, temperature, ph_level, dissolved_oxygen, 
            turbidity, ammonia_level, nitrite_level, nitrate_level, 
            salinity, water_level, flow_rate
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `,
          [
            pond.id,
            sensorReading.temperature,
            sensorReading.ph_level,
            sensorReading.dissolved_oxygen,
            sensorReading.turbidity,
            sensorReading.ammonia_level,
            sensorReading.nitrite_level,
            sensorReading.nitrate_level,
            sensorReading.salinity,
            sensorReading.water_level,
            sensorReading.flow_rate,
          ]
        );

        // Check for threshold violations and create alerts if needed
        await this.checkThresholds(pond.id, sensorReading);

        // Emit real-time data via WebSocket
        if (this.io) {
          this.io.to(`pond_${pond.id}`).emit("sensorData", {
            pondId: pond.id,
            data: newReading.rows[0],
            pond: {
              id: pond.id,
              name: pond.name,
              type: pond.type,
              farmId: pond.farm_id,
            },
          });
        }
      }

      logger.debug(
        `Generated sensor data for ${pondsResult.rows.length} ponds`
      );
    } catch (error) {
      logger.error("Generate sensor data error:", error);
    }
  }

  generateRealisticReading(pond) {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 20 || hour <= 6;

    // Base values based on pond type
    let baseValues;
    if (pond.type === "SALTWATER") {
      baseValues = {
        temperature: 24.0,
        ph_level: 8.1,
        dissolved_oxygen: 7.0,
        salinity: 35.0,
        turbidity: 2.5,
        ammonia_level: 0.1,
        nitrite_level: 0.05,
        nitrate_level: 1.0,
        water_level: 2.8,
        flow_rate: 150.0,
      };
    } else if (pond.type === "FRESHWATER") {
      baseValues = {
        temperature: 22.0,
        ph_level: 7.5,
        dissolved_oxygen: 8.0,
        salinity: 0.3,
        turbidity: 3.0,
        ammonia_level: 0.15,
        nitrite_level: 0.08,
        nitrate_level: 2.0,
        water_level: 2.5,
        flow_rate: 120.0,
      };
    } else {
      // BRACKISH
      baseValues = {
        temperature: 23.0,
        ph_level: 7.8,
        dissolved_oxygen: 7.5,
        salinity: 15.0,
        turbidity: 2.8,
        ammonia_level: 0.12,
        nitrite_level: 0.06,
        nitrate_level: 1.5,
        water_level: 2.6,
        flow_rate: 135.0,
      };
    }

    // Apply daily variations
    const dailyVariations = {
      temperature: isNight ? -1.5 : 1.0, // Cooler at night
      ph_level: isNight ? -0.1 : 0.1, // Slightly lower at night
      dissolved_oxygen: isNight ? -0.5 : 0.3, // Lower at night due to respiration
      salinity: 0, // Relatively stable
      turbidity: Math.random() > 0.9 ? 2.0 : 0, // Occasional spikes
      ammonia_level: Math.random() > 0.95 ? 0.2 : 0, // Rare spikes
      nitrite_level: Math.random() > 0.98 ? 0.1 : 0, // Very rare spikes
      nitrate_level: 0, // Gradual changes
      water_level: Math.random() > 0.95 ? -0.1 : 0.05, // Slight variations
      flow_rate: Math.random() > 0.9 ? 20.0 : 0, // Occasional flow changes
    };

    // Generate readings with realistic variations
    const reading = {};

    Object.keys(baseValues).forEach((param) => {
      let value = baseValues[param];

      // Apply daily variation
      value += dailyVariations[param];

      // Add trend from previous reading (slight continuity)
      if (
        pond[`last_${param}`] !== null &&
        pond[`last_${param}`] !== undefined
      ) {
        const trend = (pond[`last_${param}`] - value) * 0.3; // 30% continuity
        value += trend;
      }

      // Add random variation
      const variationPercent = this.getVariationPercent(param);
      const variation = value * variationPercent * (Math.random() - 0.5) * 2;
      value += variation;

      // Apply constraints
      value = this.applyConstraints(param, value);

      // Round to reasonable precision
      reading[param] = Math.round(value * 100) / 100;
    });

    // Simulate occasional sensor malfunctions (very rare)
    if (Math.random() > 0.999) {
      const params = Object.keys(reading);
      const faultyParam = params[Math.floor(Math.random() * params.length)];
      reading[faultyParam] = null; // Sensor reading failure
      logger.debug(
        `Simulated sensor malfunction for ${faultyParam} in pond ${pond.id}`
      );
    }

    return reading;
  }

  getVariationPercent(parameter) {
    // How much each parameter can vary (as percentage)
    const variations = {
      temperature: 0.05, // ±5%
      ph_level: 0.03, // ±3%
      dissolved_oxygen: 0.1, // ±10%
      salinity: 0.02, // ±2%
      turbidity: 0.2, // ±20%
      ammonia_level: 0.3, // ±30%
      nitrite_level: 0.25, // ±25%
      nitrate_level: 0.15, // ±15%
      water_level: 0.05, // ±5%
      flow_rate: 0.1, // ±10%
    };
    return variations[parameter] || 0.05;
  }

  applyConstraints(parameter, value) {
    // Apply realistic constraints to prevent impossible values
    const constraints = {
      temperature: { min: 5.0, max: 35.0 },
      ph_level: { min: 6.0, max: 9.0 },
      dissolved_oxygen: { min: 0.0, max: 15.0 },
      salinity: { min: 0.0, max: 50.0 },
      turbidity: { min: 0.0, max: 20.0 },
      ammonia_level: { min: 0.0, max: 2.0 },
      nitrite_level: { min: 0.0, max: 1.0 },
      nitrate_level: { min: 0.0, max: 10.0 },
      water_level: { min: 0.5, max: 4.0 },
      flow_rate: { min: 50.0, max: 300.0 },
    };

    const constraint = constraints[parameter];
    if (constraint) {
      return Math.max(constraint.min, Math.min(constraint.max, value));
    }
    return value;
  }

  async checkThresholds(pondId, reading) {
    try {
      // Get active thresholds for this pond
      const thresholds = await query(
        `
        SELECT * FROM thresholds 
        WHERE pond_id = $1 AND is_active = true
      `,
        [pondId]
      );

      for (const threshold of thresholds.rows) {
        const currentValue = reading[threshold.parameter];

        if (currentValue === null || currentValue === undefined) continue;

        // Check if threshold is violated
        if (
          currentValue < threshold.min_value ||
          currentValue > threshold.max_value
        ) {
          const severity = this.getSeverity(currentValue, threshold);

          // Create alert if not already exists for this violation
          const existingAlert = await query(
            `
            SELECT id FROM alerts 
            WHERE pond_id = $1 AND parameter = $2 AND is_resolved = false
            ORDER BY created_at DESC LIMIT 1
          `,
            [pondId, threshold.parameter]
          );

          if (existingAlert.rows.length === 0) {
            await this.createAlert(pondId, threshold, currentValue, severity);
          }
        }
      }
    } catch (error) {
      logger.error("Check thresholds error:", error);
    }
  }

  getSeverity(value, threshold) {
    const minDiff = threshold.min_value - value;
    const maxDiff = value - threshold.max_value;
    const maxDeviation = Math.max(minDiff, maxDiff);

    if (maxDeviation > (threshold.max_value - threshold.min_value) * 0.5) {
      return "CRITICAL";
    } else if (
      maxDeviation >
      (threshold.max_value - threshold.min_value) * 0.3
    ) {
      return "HIGH";
    } else if (
      maxDeviation >
      (threshold.max_value - threshold.min_value) * 0.1
    ) {
      return "MEDIUM";
    } else {
      return "LOW";
    }
  }

  async createAlert(pondId, threshold, currentValue, severity) {
    try {
      // Get pond and farm info
      const pondInfo = await query(
        `
        SELECT p.name, p.farm_id, f.name as farm_name
        FROM ponds p
        JOIN farms f ON p.farm_id = f.id
        WHERE p.id = $1
      `,
        [pondId]
      );

      if (pondInfo.rows.length === 0) return;

      const pond = pondInfo.rows[0];
      const thresholdValue =
        currentValue < threshold.min_value
          ? threshold.min_value
          : threshold.max_value;

      const title = `${threshold.parameter
        .replace("_", " ")
        .toUpperCase()} Alert`;
      const message = `${threshold.parameter.replace("_", " ")} is ${
        currentValue < threshold.min_value ? "below" : "above"
      } threshold in ${
        pond.name
      }. Current: ${currentValue}, Threshold: ${thresholdValue}`;

      await query(
        `
        INSERT INTO alerts (
          farm_id, pond_id, type, severity, title, message, 
          parameter, current_value, threshold_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          pond.farm_id,
          pondId,
          "THRESHOLD_EXCEEDED",
          severity,
          title,
          message,
          threshold.parameter,
          currentValue,
          thresholdValue,
        ]
      );

      logger.info(
        `Created ${severity} alert for ${threshold.parameter} in pond ${pond.name}`
      );
    } catch (error) {
      logger.error("Create alert error:", error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: "5 seconds",
      enabled: true,
    };
  }
}

module.exports = new DataSimulator();
