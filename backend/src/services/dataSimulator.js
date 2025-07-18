const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

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
      // Get all active ponds using Prisma
      const ponds = await prisma.pond.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          farm: {
            select: {
              id: true,
              name: true,
            },
          },
          sensorData: {
            orderBy: {
              timestamp: "desc",
            },
            take: 10, // Get last 10 readings for trend analysis
          },
        },
      });

      for (const pond of ponds) {
        const lastReadings = pond.sensorData;
        const sensorReading = this.generateRealisticReading(pond, lastReadings);

        // Create sensor data entries using Prisma
        const sensorDataEntries = [];

        // Add individual sensor readings for each type
        if (sensorReading.temperature !== null) {
          sensorDataEntries.push({
            pondId: pond.id,
            userId: pond.userId,
            sensorType: "TEMPERATURE",
            value: sensorReading.temperature,
            unit: "°C",
            timestamp: new Date(),
          });
        }

        if (sensorReading.ph !== null) {
          sensorDataEntries.push({
            pondId: pond.id,
            userId: pond.userId,
            sensorType: "PH",
            value: sensorReading.ph,
            unit: "pH",
            timestamp: new Date(),
          });
        }

        if (sensorReading.oxygen !== null) {
          sensorDataEntries.push({
            pondId: pond.id,
            userId: pond.userId,
            sensorType: "OXYGEN",
            value: sensorReading.oxygen,
            unit: "mg/L",
            timestamp: new Date(),
          });
        }

        if (sensorReading.salinity !== null) {
          sensorDataEntries.push({
            pondId: pond.id,
            userId: pond.userId,
            sensorType: "SALINITY",
            value: sensorReading.salinity,
            unit: "ppt",
            timestamp: new Date(),
          });
        }

        if (sensorReading.turbidity !== null) {
          sensorDataEntries.push({
            pondId: pond.id,
            userId: pond.userId,
            sensorType: "TURBIDITY",
            value: sensorReading.turbidity,
            unit: "NTU",
            timestamp: new Date(),
          });
        }

        if (sensorReading.ammonia !== null) {
          sensorDataEntries.push({
            pondId: pond.id,
            userId: pond.userId,
            sensorType: "AMMONIA",
            value: sensorReading.ammonia,
            unit: "mg/L",
            timestamp: new Date(),
          });
        }

        // Insert all sensor data
        if (sensorDataEntries.length > 0) {
          await prisma.sensorData.createMany({
            data: sensorDataEntries,
          });
        }

        // Check for threshold violations and create alerts if needed
        await this.checkThresholds(pond.id, sensorReading);

        // Emit real-time data via WebSocket
        if (this.io) {
          this.io.to(`pond_${pond.id}`).emit("sensorData", {
            pondId: pond.id,
            data: sensorReading,
            pond: {
              id: pond.id,
              name: pond.name,
              status: pond.status,
              farmId: pond.farmId,
            },
          });
        }
      }

      logger.debug(`Generated sensor data for ${ponds.length} ponds`);
    } catch (error) {
      logger.error("Generate sensor data error:", error);
    }
  }

  generateRealisticReading(pond, lastReadings) {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 20 || hour <= 6;

    // Base values - since there's no pond type in schema, we'll use generic freshwater values
    // and adjust based on existing pond parameters if available
    let baseValues = {
      temperature: pond.temperature || 22.0,
      ph: pond.ph || 7.5,
      oxygen: pond.oxygen || 8.0,
      salinity: 0.3, // Default freshwater salinity
      turbidity: pond.turbidity || 3.0,
      ammonia: 0.15,
      nitrite: 0.08,
      nitrate: 2.0,
    };

    // Apply daily variations
    const dailyVariations = {
      temperature: isNight ? -1.5 : 1.0, // Cooler at night
      ph: isNight ? -0.1 : 0.1, // Slightly lower at night
      oxygen: isNight ? -0.5 : 0.3, // Lower at night due to respiration
      salinity: 0, // Relatively stable
      turbidity: Math.random() > 0.9 ? 2.0 : 0, // Occasional spikes
      ammonia: Math.random() > 0.95 ? 0.2 : 0, // Rare spikes
      nitrite: Math.random() > 0.98 ? 0.1 : 0, // Very rare spikes
      nitrate: 0, // Gradual changes
    };

    // Generate readings with realistic variations
    const reading = {};

    Object.keys(baseValues).forEach((param) => {
      let value = baseValues[param];

      // Apply daily variation
      value += dailyVariations[param];

      // Add trend from previous readings (use average of last few readings for continuity)
      if (lastReadings && lastReadings.length > 0) {
        const relevantReadings = lastReadings.filter(
          (r) =>
            r.sensorType === param.toUpperCase() ||
            (param === "ph" && r.sensorType === "PH") ||
            (param === "oxygen" && r.sensorType === "OXYGEN") ||
            (param === "temperature" && r.sensorType === "TEMPERATURE") ||
            (param === "turbidity" && r.sensorType === "TURBIDITY") ||
            (param === "salinity" && r.sensorType === "SALINITY") ||
            (param === "ammonia" && r.sensorType === "AMMONIA")
        );

        if (relevantReadings.length > 0) {
          const avgPrevious =
            relevantReadings.reduce((sum, r) => sum + r.value, 0) /
            relevantReadings.length;
          const trend = (avgPrevious - value) * 0.3; // 30% continuity
          value += trend;
        }
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
      ph: 0.03, // ±3%
      oxygen: 0.1, // ±10%
      salinity: 0.02, // ±2%
      turbidity: 0.2, // ±20%
      ammonia: 0.3, // ±30%
      nitrite: 0.25, // ±25%
      nitrate: 0.15, // ±15%
    };
    return variations[parameter] || 0.05;
  }

  applyConstraints(parameter, value) {
    // Apply realistic constraints to prevent impossible values
    const constraints = {
      temperature: { min: 5.0, max: 35.0 },
      ph: { min: 6.0, max: 9.0 },
      oxygen: { min: 0.0, max: 15.0 },
      salinity: { min: 0.0, max: 50.0 },
      turbidity: { min: 0.0, max: 20.0 },
      ammonia: { min: 0.0, max: 2.0 },
      nitrite: { min: 0.0, max: 1.0 },
      nitrate: { min: 0.0, max: 10.0 },
    };

    const constraint = constraints[parameter];
    if (constraint) {
      return Math.max(constraint.min, Math.min(constraint.max, value));
    }
    return value;
  }

  async checkThresholds(pondId, reading) {
    try {
      // Get pond with thresholds - Note: assuming you have a thresholds relation
      // If not, you'll need to create a Threshold model in your Prisma schema
      const pond = await prisma.pond.findUnique({
        where: { id: pondId },
        include: {
          // thresholds: true // Uncomment if you have thresholds relation
        },
      });

      if (!pond) return;

      // For now, use basic threshold checking
      // You can expand this once you have the thresholds table properly set up
      const basicThresholds = {
        temperature: { min: 18.0, max: 28.0 },
        ph: { min: 6.5, max: 8.5 },
        oxygen: { min: 5.0, max: 12.0 },
        ammonia: { min: 0.0, max: 0.5 },
      };

      for (const [param, threshold] of Object.entries(basicThresholds)) {
        const currentValue = reading[param];

        if (currentValue === null || currentValue === undefined) continue;

        // Check if threshold is violated
        if (currentValue < threshold.min || currentValue > threshold.max) {
          const severity = this.getSeverity(currentValue, threshold);

          // Check if similar alert already exists
          const existingAlert = await prisma.alert.findFirst({
            where: {
              pondId,
              type: this.getAlertType(param, currentValue, threshold),
              isResolved: false,
              createdAt: {
                gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
              },
            },
          });

          if (!existingAlert) {
            await this.createAlert(
              pondId,
              param,
              currentValue,
              threshold,
              severity
            );
          }
        }
      }
    } catch (error) {
      logger.error("Check thresholds error:", error);
    }
  }

  getAlertType(param, value, threshold) {
    const isHigh = value > threshold.max;
    const paramUpper = param.toUpperCase();
    return isHigh ? `${paramUpper}_HIGH` : `${paramUpper}_LOW`;
  }

  getSeverity(value, threshold) {
    const range = threshold.max - threshold.min;
    const deviation = Math.max(threshold.min - value, value - threshold.max);
    const deviationRatio = deviation / range;

    if (deviationRatio > 0.5) return "CRITICAL";
    if (deviationRatio > 0.3) return "HIGH";
    if (deviationRatio > 0.1) return "MEDIUM";
    return "LOW";
  }

  async createAlert(pondId, parameter, currentValue, threshold, severity) {
    try {
      // Get pond info
      const pond = await prisma.pond.findUnique({
        where: { id: pondId },
        include: {
          farm: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!pond) return;

      const thresholdValue =
        currentValue < threshold.min ? threshold.min : threshold.max;
      const alertType = this.getAlertType(parameter, currentValue, threshold);

      const message = `${parameter.replace("_", " ").toUpperCase()} is ${
        currentValue < threshold.min ? "below" : "above"
      } safe threshold in ${
        pond.name
      }. Current: ${currentValue}, Threshold: ${thresholdValue}`;

      await prisma.alert.create({
        data: {
          pondId,
          userId: pond.userId,
          type: alertType,
          severity,
          message,
          metadata: {
            parameter,
            currentValue,
            thresholdValue,
            farmName: pond.farm.name,
          },
        },
      });

      logger.info(
        `Created ${severity} alert for ${parameter} in pond ${pond.name}`
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
