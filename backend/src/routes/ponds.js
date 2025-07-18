const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/ponds
// @desc    Get all ponds for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { page = 1, limit = 10, farmId, type } = req.query;

    // Build where clause
    const where = {};
    
    // Filter by farm access (user must be associated with the farm)
    const userFarms = await prisma.farmUser.findMany({
      where: { userId: req.user.userId },
      select: { farmId: true }
    });
    
    const farmIds = userFarms.map(uf => uf.farmId);
    
    if (farmIds.length === 0) {
      return res.json({
        success: true,
        data: {
          ponds: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        }
      });
    }
    
    where.farmId = { in: farmIds };
    
    if (farmId) {
      where.farmId = farmId;
    }
    
    if (type) {
      where.type = type;
    }

    where.isActive = true;

    // Get total count
    const total = await prisma.pond.count({ where });

    // Get ponds with pagination
    const ponds = await prisma.pond.findMany({
      where,
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        },
        sensorData: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            temperature: true,
            ph: true,
            oxygen: true,
            salinity: true,
            timestamp: true,
          }
        },
        alerts: {
          where: {
            isResolved: false,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            type: true,
            severity: true,
            message: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            alerts: {
              where: { isResolved: false }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        ponds,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get ponds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ponds',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/ponds/:id
// @desc    Get pond by ID
// @access  Private
router.get('/:id', [
  param('id').isString().withMessage('Pond ID must be a string'),
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

    // Check if user has access to this pond
    const pond = await prisma.pond.findFirst({
      where: {
        id,
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
            description: true,
          }
        },
        thresholds: {
          where: { isActive: true },
          orderBy: { parameter: 'asc' }
        },
        sensorData: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            sensorData: true,
            alerts: {
              where: { isResolved: false }
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

    res.json({
      success: true,
      data: { pond }
    });

  } catch (error) {
    logger.error('Get pond error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pond',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/ponds
// @desc    Create a new pond
// @access  Private (Farmers and above)
router.post('/', [
  authorize('FARMER', 'ADMIN'),
  body('farmId')
    .isString()
    .withMessage('Farm ID is required'),
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Pond name must be between 3 and 100 characters'),
  body('type')
    .isIn(['freshwater', 'saltwater', 'brackish'])
    .withMessage('Type must be freshwater, saltwater, or brackish'),
  body('volume')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Volume must be a positive number'),
  body('depth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Depth must be a positive number'),
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
    const { farmId, name, type, volume, depth } = req.body;

    // Check if user has access to the farm
    const farmUser = await prisma.farmUser.findFirst({
      where: {
        userId: req.user.userId,
        farmId,
        role: { in: ['owner', 'manager'] }
      }
    });

    if (!farmUser && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create ponds in this farm'
      });
    }

    // Create pond
    const pond = await prisma.pond.create({
      data: {
        farmId,
        name,
        type,
        volume: volume || null,
        depth: depth || null,
        temperature: null,
        ph: null,
        oxygen: null,
        salinity: null,
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      }
    });

    // Create default thresholds based on pond type
    const defaultThresholds = [];
    
    if (type === 'saltwater') {
      defaultThresholds.push(
        { pondId: pond.id, parameter: 'TEMPERATURE', minValue: 16.0, maxValue: 22.0, criticalMin: 14.0, criticalMax: 25.0 },
        { pondId: pond.id, parameter: 'PH', minValue: 7.8, maxValue: 8.3, criticalMin: 7.5, criticalMax: 8.5 },
        { pondId: pond.id, parameter: 'OXYGEN', minValue: 6.0, maxValue: 9.0, criticalMin: 5.0, criticalMax: 12.0 },
        { pondId: pond.id, parameter: 'SALINITY', minValue: 32.0, maxValue: 37.0, criticalMin: 30.0, criticalMax: 40.0 }
      );
    } else if (type === 'freshwater') {
      defaultThresholds.push(
        { pondId: pond.id, parameter: 'TEMPERATURE', minValue: 15.0, maxValue: 20.0, criticalMin: 12.0, criticalMax: 23.0 },
        { pondId: pond.id, parameter: 'PH', minValue: 7.0, maxValue: 8.0, criticalMin: 6.5, criticalMax: 8.5 },
        { pondId: pond.id, parameter: 'OXYGEN', minValue: 7.0, maxValue: 10.0, criticalMin: 6.0, criticalMax: 12.0 },
        { pondId: pond.id, parameter: 'SALINITY', minValue: 0.0, maxValue: 1.0, criticalMin: 0.0, criticalMax: 2.0 }
      );
    } else { // brackish
      defaultThresholds.push(
        { pondId: pond.id, parameter: 'TEMPERATURE', minValue: 15.5, maxValue: 21.0, criticalMin: 13.0, criticalMax: 24.0 },
        { pondId: pond.id, parameter: 'PH', minValue: 7.4, maxValue: 8.2, criticalMin: 7.0, criticalMax: 8.6 },
        { pondId: pond.id, parameter: 'OXYGEN', minValue: 6.5, maxValue: 9.5, criticalMin: 5.5, criticalMax: 11.5 },
        { pondId: pond.id, parameter: 'SALINITY', minValue: 5.0, maxValue: 25.0, criticalMin: 3.0, criticalMax: 30.0 }
      );
    }

    await prisma.threshold.createMany({
      data: defaultThresholds
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'create_pond',
        entity: 'pond',
        entityId: pond.id,
        details: { farmId, name, type },
      }
    });

    logger.info(`Pond created: ${name} by user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Pond created successfully',
      data: { pond }
    });

  } catch (error) {
    logger.error('Create pond error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pond',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/ponds/:id
// @desc    Update pond
// @access  Private (Farmers and above)
router.put('/:id', [
  authorize('FARMER', 'ADMIN'),
  param('id').isString().withMessage('Pond ID must be a string'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Pond name must be between 3 and 100 characters'),
  body('type')
    .optional()
    .isIn(['freshwater', 'saltwater', 'brackish'])
    .withMessage('Type must be freshwater, saltwater, or brackish'),
  body('volume')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Volume must be a positive number'),
  body('depth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Depth must be a positive number'),
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
    const { name, type, volume, depth } = req.body;

    // Check if pond exists and user has access
    const existingPond = await prisma.pond.findFirst({
      where: {
        id,
        farm: {
          users: {
            some: {
              userId: req.user.userId,
              role: { in: ['owner', 'manager'] }
            }
          }
        }
      }
    });

    if (!existingPond && req.user.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'Pond not found or access denied'
      });
    }

    // Update pond
    const pond = await prisma.pond.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(volume !== undefined && { volume }),
        ...(depth !== undefined && { depth }),
      },
      include: {
        farm: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'update_pond',
        entity: 'pond',
        entityId: pond.id,
        details: { name, type, volume, depth },
      }
    });

    logger.info(`Pond updated: ${pond.name} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Pond updated successfully',
      data: { pond }
    });

  } catch (error) {
    logger.error('Update pond error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pond',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/ponds/:id
// @desc    Delete pond (soft delete)
// @access  Private (Farmers and above)
router.delete('/:id', [
  authorize('FARMER', 'ADMIN'),
  param('id').isString().withMessage('Pond ID must be a string'),
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

    // Check if pond exists and user has access
    const existingPond = await prisma.pond.findFirst({
      where: {
        id,
        farm: {
          users: {
            some: {
              userId: req.user.userId,
              role: { in: ['owner', 'manager'] }
            }
          }
        }
      }
    });

    if (!existingPond && req.user.role !== 'ADMIN') {
      return res.status(404).json({
        success: false,
        message: 'Pond not found or access denied'
      });
    }

    // Soft delete pond
    await prisma.pond.update({
      where: { id },
      data: { isActive: false }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'delete_pond',
        entity: 'pond',
        entityId: id,
        details: { name: existingPond.name },
      }
    });

    logger.info(`Pond deleted: ${existingPond.name} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Pond deleted successfully'
    });

  } catch (error) {
    logger.error('Delete pond error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pond',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
