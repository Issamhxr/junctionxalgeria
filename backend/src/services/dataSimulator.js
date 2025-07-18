const cron = require('node-cron');
const logger = require('../utils/logger');

class DataSimulator {
  constructor() {
    this.io = null;
    this.prisma = null;
    this.isRunning = false;
    this.simulationJob = null;
  }

  async start(io, prisma) {
    this.io = io;
    this.prisma = prisma;

    if (this.isRunning) {
      logger.warn('Data simulation is already running');
      return;
    }

    // Get simulation interval from environment (default 30 seconds)
    const interval = parseInt(process.env.SIMULATION_INTERVAL) || 30000;
    const cronPattern = this.getCronPattern(interval);

    this.simulationJob = cron.schedule(cronPattern, async () => {
      try {
        await this.generateSensorData();
      } catch (error) {
        logger.error('Data simulation error:', error);
      }
    });

    this.isRunning = true;
    logger.info(`Data simulation started with ${interval}ms interval`);
  }

  stop() {
    if (this.simulationJob) {
      this.simulationJob.stop();
      this.simulationJob = null;
    }
    this.isRunning = false;
    logger.info('Data simulation stopped');
  }

  getCronPattern(intervalMs) {
    // Convert milliseconds to cron pattern
    if (intervalMs >= 60000) {
      const minutes = Math.floor(intervalMs / 60000);
      return `*/${minutes} * * * *`; // Every N minutes
    } else {
      // For intervals less than 1 minute, use every minute
      return '* * * * *'; // Every minute
    }
  }

  async generateSensorData() {
    if (!this.prisma) return;

    try {
      // Get all active ponds
      const ponds = await this.prisma.pond.findMany({
        where: { isActive: true },
        include: {
          thresholds: {
            where: { isActive: true }
          },
          sensorData: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });

      for (const pond of ponds) {
        const sensorReading = this.generateRealisticReading(pond);
        
        // Create sensor data entry
        const newReading = await this.prisma.sensorData.create({
          data: {
            pondId: pond.id,
            temperature: sensorReading.temperature,
            ph: sensorReading.ph,
            oxygen: sensorReading.oxygen,
            salinity: sensorReading.salinity,
            turbidity: sensorReading.turbidity,
            ammonia: sensorReading.ammonia,
            nitrite: sensorReading.nitrite,
            nitrate: sensorReading.nitrate,
          }
        });

        // Update pond's current values
        await this.prisma.pond.update({
          where: { id: pond.id },
          data: {
            temperature: sensorReading.temperature,
            ph: sensorReading.ph,
            oxygen: sensorReading.oxygen,
            salinity: sensorReading.salinity,
          }
        });

        // Emit real-time data
        if (this.io) {
          this.io.to(`pond_${pond.id}`).emit('sensorData', {
            pondId: pond.id,
            data: newReading,
            pond: {
              id: pond.id,
              name: pond.name,
              type: pond.type,
            }
          });
        }
      }

      logger.debug(`Generated sensor data for ${ponds.length} ponds`);
    } catch (error) {
      logger.error('Generate sensor data error:', error);
    }
  }

  generateRealisticReading(pond) {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 20 || hour <= 6;
    
    // Get previous reading for trend continuation
    const prevReading = pond.sensorData.length > 0 ? pond.sensorData[0] : null;
    
    // Base values based on pond type
    let baseValues;
    if (pond.type === 'saltwater') {
      baseValues = {
        temperature: 19.0,
        ph: 8.1,
        oxygen: 7.0,
        salinity: 35.0,
        turbidity: 2.5,
        ammonia: 0.1,
        nitrite: 0.05,
        nitrate: 1.0,
      };
    } else if (pond.type === 'freshwater') {
      baseValues = {
        temperature: 17.0,
        ph: 7.5,
        oxygen: 8.0,
        salinity: 0.3,
        turbidity: 3.0,
        ammonia: 0.15,
        nitrite: 0.08,
        nitrate: 2.0,
      };
    } else { // brackish
      baseValues = {
        temperature: 18.0,
        ph: 7.8,
        oxygen: 7.5,
        salinity: 15.0,
        turbidity: 2.8,
        ammonia: 0.12,
        nitrite: 0.06,
        nitrate: 1.5,
      };
    }

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
    
    Object.keys(baseValues).forEach(param => {
      let value = baseValues[param];
      
      // Apply daily variation
      value += dailyVariations[param];
      
      // Add trend from previous reading (slight continuity)
      if (prevReading && prevReading[param] !== null) {
        const trend = (prevReading[param] - value) * 0.3; // 30% continuity
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
      logger.debug(`Simulated sensor malfunction for ${faultyParam} in pond ${pond.id}`);
    }

    return reading;
  }

  getVariationPercent(parameter) {
    // How much each parameter can vary (as percentage)
    const variations = {
      temperature: 0.05, // ±5%
      ph: 0.03, // ±3%
      oxygen: 0.10, // ±10%
      salinity: 0.02, // ±2%
      turbidity: 0.20, // ±20%
      ammonia: 0.30, // ±30%
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

  // Generate specific scenarios for testing
  async simulateScenario(pondId, scenario) {
    if (!this.prisma) return;

    try {
      const pond = await this.prisma.pond.findUnique({
        where: { id: pondId },
        include: { thresholds: true }
      });

      if (!pond) {
        throw new Error('Pond not found');
      }

      let reading;
      
      switch (scenario) {
        case 'high_temperature':
          reading = this.generateRealisticReading(pond);
          reading.temperature = 25.0; // High temperature
          break;
          
        case 'low_oxygen':
          reading = this.generateRealisticReading(pond);
          reading.oxygen = 4.0; // Low oxygen
          break;
          
        case 'ph_spike':
          reading = this.generateRealisticReading(pond);
          reading.ph = 9.2; // High pH
          break;
          
        case 'sensor_failure':
          reading = this.generateRealisticReading(pond);
          reading.temperature = null; // Sensor failure
          reading.ph = null;
          break;
          
        default:
          reading = this.generateRealisticReading(pond);
      }

      // Create the sensor reading
      const newReading = await this.prisma.sensorData.create({
        data: {
          pondId: pond.id,
          temperature: reading.temperature,
          ph: reading.ph,
          oxygen: reading.oxygen,
          salinity: reading.salinity,
          turbidity: reading.turbidity,
          ammonia: reading.ammonia,
          nitrite: reading.nitrite,
          nitrate: reading.nitrate,
        }
      });

      // Update pond values
      await this.prisma.pond.update({
        where: { id: pond.id },
        data: {
          temperature: reading.temperature,
          ph: reading.ph,
          oxygen: reading.oxygen,
          salinity: reading.salinity,
        }
      });

      // Emit real-time data
      if (this.io) {
        this.io.to(`pond_${pond.id}`).emit('sensorData', {
          pondId: pond.id,
          data: newReading,
          pond: {
            id: pond.id,
            name: pond.name,
            type: pond.type,
          }
        });
      }

      logger.info(`Simulated scenario '${scenario}' for pond ${pond.name}`);
      return newReading;
    } catch (error) {
      logger.error('Simulate scenario error:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: process.env.SIMULATION_INTERVAL || 30000,
      enabled: process.env.ENABLE_DATA_SIMULATION === 'true',
    };
  }
}

module.exports = new DataSimulator();
