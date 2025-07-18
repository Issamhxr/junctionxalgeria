const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview data
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    // Get user's farms
    const userFarms = await prisma.farmUser.findMany({
      where: { userId: req.user.userId },
      select: { farmId: true }
    });

    const farmIds = userFarms.map(uf => uf.farmId);

    if (farmIds.length === 0) {
      return res.json({
        success: true,
        data: {
          farms: 0,
          ponds: 0,
          activeAlerts: 0,
          totalSensorReadings: 0,
          recentActivity: [],
        }
      });
    }

    // Get counts
    const farmsCount = farmIds.length;
    
    const pondsCount = await prisma.pond.count({
      where: { 
        farmId: { in: farmIds },
        isActive: true 
      }
    });

    const activeAlertsCount = await prisma.alert.count({
      where: { 
        farmId: { in: farmIds },
        isResolved: false 
      }
    });

    // Get total sensor readings from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const totalSensorReadings = await prisma.sensorData.count({
      where: {
        timestamp: { gte: thirtyDaysAgo },
        pond: {
          farmId: { in: farmIds }
        }
      }
    });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        userId: req.user.userId,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Get farms with their pond counts and recent alerts
    const farms = await prisma.farm.findMany({
      where: { 
        id: { in: farmIds },
        isActive: true 
      },
      include: {
        _count: {
          select: {
            ponds: {
              where: { isActive: true }
            },
            alerts: {
              where: { isResolved: false }
            }
          }
        },
        ponds: {
          where: { isActive: true },
          take: 3,
          select: {
            id: true,
            name: true,
            type: true,
            temperature: true,
            ph: true,
            oxygen: true,
            salinity: true,
          },
          orderBy: { updatedAt: 'desc' }
        }
      },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        summary: {
          farms: farmsCount,
          ponds: pondsCount,
          activeAlerts: activeAlertsCount,
          totalSensorReadings,
        },
        farms,
        recentActivity,
      }
    });

  } catch (error) {
    logger.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard overview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/dashboard/analytics/:pondId
// @desc    Get detailed analytics for a specific pond
// @access  Private
router.get('/analytics/:pondId', [
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
    const { period = 'week' } = req.query;

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
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        },
        thresholds: {
          where: { isActive: true }
        }
      }
    });

    if (!pond) {
      return res.status(404).json({
        success: false,
        message: 'Pond not found or access denied'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate, groupByFormat;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        groupByFormat = 'hour';
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupByFormat = 'day';
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupByFormat = 'day';
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupByFormat = 'day';
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

    // Get alerts for the period
    const alerts = await prisma.alert.findMany({
      where: {
        pondId,
        createdAt: {
          gte: startDate,
          lte: now,
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Process data for charts
    const chartData = [];
    const dataPoints = new Map();

    sensorData.forEach(reading => {
      let key;
      const date = new Date(reading.timestamp);
      
      if (groupByFormat === 'hour') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      }

      if (!dataPoints.has(key)) {
        dataPoints.set(key, []);
      }
      dataPoints.get(key).push(reading);
    });

    // Calculate averages for each time period
    dataPoints.forEach((readings, key) => {
      const avgData = {
        timestamp: readings[0].timestamp,
        temperature: readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length,
        ph: readings.reduce((sum, r) => sum + r.ph, 0) / readings.length,
        oxygen: readings.reduce((sum, r) => sum + r.oxygen, 0) / readings.length,
        salinity: readings.reduce((sum, r) => sum + r.salinity, 0) / readings.length,
        count: readings.length,
      };

      // Round to 2 decimal places
      Object.keys(avgData).forEach(key => {
        if (typeof avgData[key] === 'number' && key !== 'count') {
          avgData[key] = Math.round(avgData[key] * 100) / 100;
        }
      });

      chartData.push(avgData);
    });

    // Calculate parameter compliance (within thresholds)
    const compliance = {};
    const thresholdMap = {};
    
    pond.thresholds.forEach(threshold => {
      thresholdMap[threshold.parameter] = threshold;
    });

    ['TEMPERATURE', 'PH', 'OXYGEN', 'SALINITY'].forEach(param => {
      const paramKey = param.toLowerCase();
      const threshold = thresholdMap[param];
      
      if (threshold && sensorData.length > 0) {
        const paramValues = sensorData.map(d => d[paramKey]);
        const withinRange = paramValues.filter(value => 
          value >= threshold.minValue && value <= threshold.maxValue
        ).length;
        
        compliance[paramKey] = {
          percentage: Math.round((withinRange / paramValues.length) * 100),
          withinRange,
          total: paramValues.length,
          threshold: {
            min: threshold.minValue,
            max: threshold.maxValue,
            criticalMin: threshold.criticalMin,
            criticalMax: threshold.criticalMax,
          }
        };
      } else {
        compliance[paramKey] = {
          percentage: 0,
          withinRange: 0,
          total: 0,
          threshold: null,
        };
      }
    });

    // Calculate recent trends
    const trends = {};
    if (sensorData.length >= 2) {
      const recent = sensorData.slice(-10); // Last 10 readings
      const older = sensorData.slice(-20, -10); // Previous 10 readings
      
      if (older.length > 0) {
        ['temperature', 'ph', 'oxygen', 'salinity'].forEach(param => {
          const recentAvg = recent.reduce((sum, r) => sum + r[param], 0) / recent.length;
          const olderAvg = older.reduce((sum, r) => sum + r[param], 0) / older.length;
          const change = recentAvg - olderAvg;
          
          trends[param] = {
            change: Math.round(change * 100) / 100,
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            percentage: olderAvg !== 0 ? Math.round((change / olderAvg) * 100 * 100) / 100 : 0,
          };
        });
      }
    }

    res.json({
      success: true,
      data: {
        pond: {
          id: pond.id,
          name: pond.name,
          type: pond.type,
          farm: pond.farm,
        },
        period,
        dateRange: {
          start: startDate,
          end: now,
        },
        chartData,
        compliance,
        trends,
        alerts: alerts.slice(0, 10), // Last 10 alerts
        summary: {
          totalReadings: sensorData.length,
          totalAlerts: alerts.length,
          unresolvedAlerts: alerts.filter(a => !a.isResolved).length,
        }
      }
    });

  } catch (error) {
    logger.error('Get pond analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pond analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/dashboard/farms
// @desc    Get farms summary for dashboard
// @access  Private
router.get('/farms', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    // Get user's farms with detailed information
    const userFarms = await prisma.farmUser.findMany({
      where: { userId: req.user.userId },
      include: {
        farm: {
          include: {
            _count: {
              select: {
                ponds: {
                  where: { isActive: true }
                },
                alerts: {
                  where: { isResolved: false }
                }
              }
            },
            ponds: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                type: true,
                temperature: true,
                ph: true,
                oxygen: true,
                salinity: true,
                updatedAt: true,
              },
              orderBy: { updatedAt: 'desc' }
            }
          }
        }
      }
    });

    const farms = userFarms.map(uf => ({
      ...uf.farm,
      userRole: uf.role,
    }));

    res.json({
      success: true,
      data: { farms }
    });

  } catch (error) {
    logger.error('Get farms summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get farms summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/dashboard/activity
// @desc    Get recent activity for dashboard
// @access  Private
router.get('/activity', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
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
    const { limit = 20 } = req.query;

    const activities = await prisma.activityLog.findMany({
      where: {
        userId: req.user.userId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: { activities }
    });

  } catch (error) {
    logger.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
