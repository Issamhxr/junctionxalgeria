const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/sensors/data/:pondId
// @desc    Get sensor data for a pond
// @access  Private
router.get('/data/:pondId', [
  param('pondId').isString().withMessage('Pond ID must be a string'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const prisma = req.app.get('prisma');
    const { pondId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    // Check if user has access to this pond
    const pond = await prisma.pond.findFirst({
      where: {
        id: pondId,
        farm: {
          users: {
            some: {
              userId: req.user.userId
            }
          }
        }
      }
    });

    if (!pond) {
      return res.status(404).json({
        success: false,
        message: 'Pond not found or access denied'
      });
    }

    // Build where clause for date filtering
    const where = { pondId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get sensor data
    const sensorData = await prisma.sensorData.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        sensorData,
        pond: {
          id: pond.id,
          name: pond.name,
          type: pond.type,
        }
      }
    });

  } catch (error) {
    logger.error('Get sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/sensors/data
// @desc    Add new sensor reading
// @access  Private (Technicians and above)
router.post('/data', [
  authorize('TECHNICIAN', 'FARMER', 'ADMIN'),
  body('pondId')
    .isString()
    .withMessage('Pond ID is required'),
  body('temperature')
    .isFloat({ min: -10, max: 50 })
    .withMessage('Temperature must be between -10 and 50°C'),
  body('ph')
    .isFloat({ min: 0, max: 14 })
    .withMessage('pH must be between 0 and 14'),
  body('oxygen')
    .isFloat({ min: 0, max: 20 })
    .withMessage('Oxygen level must be between 0 and 20 mg/L'),
  body('salinity')
    .isFloat({ min: 0, max: 50 })
    .withMessage('Salinity must be between 0 and 50 ppt'),
  body('turbidity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Turbidity must be a positive number'),
  body('ammonia')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ammonia must be a positive number'),
  body('nitrite')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Nitrite must be a positive number'),
  body('nitrate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Nitrate must be a positive number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const prisma = req.app.get('prisma');
    const { pondId, temperature, ph, oxygen, salinity, turbidity, ammonia, nitrite, nitrate } = req.body;

    // Check if user has access to this pond
    const pond = await prisma.pond.findFirst({
      where: {
        id: pondId,
        farm: {
          users: {
            some: {
              userId: req.user.userId
            }
          }
        }
      }
    });

    if (!pond) {
      return res.status(404).json({
        success: false,
        message: 'Pond not found or access denied'
      });
    }

    // Create sensor reading
    const sensorReading = await prisma.sensorData.create({
      data: {
        pondId,
        temperature,
        ph,
        oxygen,
        salinity,
        turbidity: turbidity || null,
        ammonia: ammonia || null,
        nitrite: nitrite || null,
        nitrate: nitrate || null,
      }
    });

    // Update pond's current values
    await prisma.pond.update({
      where: { id: pondId },
      data: {
        temperature,
        ph,
        oxygen,
        salinity,
      }
    });

    // Emit real-time data to connected clients
    const io = req.app.get('io');
    io.to(`pond_${pondId}`).emit('sensorData', {
      pondId,
      data: sensorReading,
      pond: {
        id: pond.id,
        name: pond.name,
        type: pond.type,
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'add_sensor_data',
        entity: 'sensor_data',
        entityId: sensorReading.id,
        details: { pondId, temperature, ph, oxygen, salinity },
      }
    });

    logger.info(`Sensor data added for pond ${pondId} by user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Sensor data recorded successfully',
      data: { sensorReading }
    });

  } catch (error) {
    logger.error('Add sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/sensors/stats/:pondId
// @desc    Get statistics for sensor data
// @access  Private
router.get('/stats/:pondId', [
  param('pondId').isString().withMessage('Pond ID must be a string'),
  query('period').optional().isIn(['day', 'week', 'month']).withMessage('Period must be day, week, or month'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const prisma = req.app.get('prisma');
    const { pondId } = req.params;
    const { period = 'day' } = req.query;

    // Check if user has access to this pond
    const pond = await prisma.pond.findFirst({
      where: {
        id: pondId,
        farm: {
          users: {
            some: {
              userId: req.user.userId
            }
          }
        }
      }
    });

    if (!pond) {
      return res.status(404).json({
        success: false,
        message: 'Pond not found or access denied'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get sensor data for the period
    const sensorData = await prisma.sensorData.findMany({
      where: {
        pondId,
        timestamp: {
          gte: startDate,
          lte: now,
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (sensorData.length === 0) {
      return res.json({
        success: true,
        data: {
          period,
          count: 0,
          stats: null,
          trends: null,
        }
      });
    }

    // Calculate statistics
    const stats = {
      temperature: {
        min: Math.min(...sensorData.map(d => d.temperature)),
        max: Math.max(...sensorData.map(d => d.temperature)),
        avg: sensorData.reduce((sum, d) => sum + d.temperature, 0) / sensorData.length,
        current: sensorData[sensorData.length - 1].temperature,
      },
      ph: {
        min: Math.min(...sensorData.map(d => d.ph)),
        max: Math.max(...sensorData.map(d => d.ph)),
        avg: sensorData.reduce((sum, d) => sum + d.ph, 0) / sensorData.length,
        current: sensorData[sensorData.length - 1].ph,
      },
      oxygen: {
        min: Math.min(...sensorData.map(d => d.oxygen)),
        max: Math.max(...sensorData.map(d => d.oxygen)),
        avg: sensorData.reduce((sum, d) => sum + d.oxygen, 0) / sensorData.length,
        current: sensorData[sensorData.length - 1].oxygen,
      },
      salinity: {
        min: Math.min(...sensorData.map(d => d.salinity)),
        max: Math.max(...sensorData.map(d => d.salinity)),
        avg: sensorData.reduce((sum, d) => sum + d.salinity, 0) / sensorData.length,
        current: sensorData[sensorData.length - 1].salinity,
      }
    };

    // Calculate trends (simple comparison between first and last readings)
    const first = sensorData[0];
    const last = sensorData[sensorData.length - 1];
    
    const trends = {
      temperature: last.temperature - first.temperature,
      ph: last.ph - first.ph,
      oxygen: last.oxygen - first.oxygen,
      salinity: last.salinity - first.salinity,
    };

    // Round all values to 2 decimal places
    Object.keys(stats).forEach(param => {
      Object.keys(stats[param]).forEach(key => {
        stats[param][key] = Math.round(stats[param][key] * 100) / 100;
      });
    });

    Object.keys(trends).forEach(param => {
      trends[param] = Math.round(trends[param] * 100) / 100;
    });

    res.json({
      success: true,
      data: {
        period,
        count: sensorData.length,
        stats,
        trends,
        dateRange: {
          start: startDate,
          end: now,
        }
      }
    });

  } catch (error) {
    logger.error('Get sensor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sensor statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/sensors/latest/:pondId
// @desc    Get latest sensor reading for a pond
// @access  Private
router.get('/latest/:pondId', [
  param('pondId').isString().withMessage('Pond ID must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const prisma = req.app.get('prisma');
    const { pondId } = req.params;

    // Check if user has access to this pond
    const pond = await prisma.pond.findFirst({
      where: {
        id: pondId,
        farm: {
          users: {
            some: {
              userId: req.user.userId
            }
          }
        }
      }
    });

    if (!pond) {
      return res.status(404).json({
        success: false,
        message: 'Pond not found or access denied'
      });
    }

    // Get latest sensor reading
    const latestReading = await prisma.sensorData.findFirst({
      where: { pondId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestReading) {
      return res.json({
        success: true,
        data: {
          sensorReading: null,
          message: 'No sensor data available for this pond'
        }
      });
    }

    res.json({
      success: true,
      data: {
        sensorReading: latestReading,
        pond: {
          id: pond.id,
          name: pond.name,
          type: pond.type,
        }
      }
    });

  } catch (error) {
    logger.error('Get latest sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get latest sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/sensors/data/:id
// @desc    Delete sensor reading (Admin only)
// @access  Private (Admin only)
router.delete('/data/:id', [
  authorize('ADMIN'),
  param('id').isString().withMessage('Sensor data ID must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const prisma = req.app.get('prisma');
    const { id } = req.params;

    // Check if sensor reading exists
    const sensorReading = await prisma.sensorData.findUnique({
      where: { id },
      include: {
        pond: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!sensorReading) {
      return res.status(404).json({
        success: false,
        message: 'Sensor reading not found'
      });
    }

    // Delete sensor reading
    await prisma.sensorData.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'delete_sensor_data',
        entity: 'sensor_data',
        entityId: id,
        details: { pondId: sensorReading.pondId, pondName: sensorReading.pond.name },
      }
    });

    logger.info(`Sensor data deleted: ${id} by admin ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Sensor reading deleted successfully'
    });

  } catch (error) {
    logger.error('Delete sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sensor reading',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
