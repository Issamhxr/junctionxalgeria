const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', [
  authorize('ADMIN'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['ADMIN', 'FARMER', 'TECHNICIAN', 'VIEWER']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
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
    const { page = 1, limit = 20, role, isActive } = req.query;

    // Build where clause
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            farms: true,
            alerts: true,
            activityLogs: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or self)
router.get('/:id', [
  param('id').isString().withMessage('User ID must be a string'),
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

    // Check if user is admin or requesting their own data
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user data'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      include: {
        preferences: true,
        farms: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                location: true,
                description: true,
              }
            }
          }
        },
        _count: {
          select: {
            alerts: true,
            activityLogs: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin only)
router.put('/:id/role', [
  authorize('ADMIN'),
  param('id').isString().withMessage('User ID must be a string'),
  body('role')
    .isIn(['ADMIN', 'FARMER', 'TECHNICIAN', 'VIEWER'])
    .withMessage('Role must be ADMIN, FARMER, TECHNICIAN, or VIEWER'),
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
    const { role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (id === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'update_user_role',
        entity: 'user',
        entityId: id,
        details: { 
          targetEmail: existingUser.email,
          oldRole: existingUser.role,
          newRole: role 
        },
      }
    });

    logger.info(`User role updated: ${existingUser.email} from ${existingUser.role} to ${role} by admin ${req.user.userId}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Activate/deactivate user (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', [
  authorize('ADMIN'),
  param('id').isString().withMessage('User ID must be a string'),
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be boolean'),
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
    const { isActive } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, isActive: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user.userId && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: isActive ? 'activate_user' : 'deactivate_user',
        entity: 'user',
        entityId: id,
        details: { 
          targetEmail: existingUser.email,
          oldStatus: existingUser.isActive,
          newStatus: isActive 
        },
      }
    });

    logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${existingUser.email} by admin ${req.user.userId}`);

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: updatedUser }
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/:id/preferences
// @desc    Get user preferences
// @access  Private (Admin or self)
router.get('/:id/preferences', [
  param('id').isString().withMessage('User ID must be a string'),
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

    // Check if user is admin or requesting their own data
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user preferences'
      });
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId: id }
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }

    res.json({
      success: true,
      data: { preferences }
    });

  } catch (error) {
    logger.error('Get user preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id/preferences
// @desc    Update user preferences
// @access  Private (Admin or self)
router.put('/:id/preferences', [
  param('id').isString().withMessage('User ID must be a string'),
  body('emailAlerts').optional().isBoolean().withMessage('emailAlerts must be boolean'),
  body('smsAlerts').optional().isBoolean().withMessage('smsAlerts must be boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('pushNotifications must be boolean'),
  body('alertSeverity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid alert severity'),
  body('language').optional().isIn(['en', 'fr', 'ar']).withMessage('Language must be en, fr, or ar'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
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
    const { emailAlerts, smsAlerts, pushNotifications, alertSeverity, language, timezone } = req.body;

    // Check if user is admin or updating their own preferences
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user preferences'
      });
    }

    // Update preferences
    const updatedPreferences = await prisma.userPreference.upsert({
      where: { userId: id },
      update: {
        ...(emailAlerts !== undefined && { emailAlerts }),
        ...(smsAlerts !== undefined && { smsAlerts }),
        ...(pushNotifications !== undefined && { pushNotifications }),
        ...(alertSeverity && { alertSeverity }),
        ...(language && { language }),
        ...(timezone && { timezone }),
      },
      create: {
        userId: id,
        emailAlerts: emailAlerts ?? true,
        smsAlerts: smsAlerts ?? false,
        pushNotifications: pushNotifications ?? true,
        alertSeverity: alertSeverity ?? 'medium',
        language: language ?? 'en',
        timezone: timezone ?? 'Africa/Algiers',
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: 'update_preferences',
        entity: 'user_preference',
        entityId: updatedPreferences.id,
        details: { targetUserId: id, updatedFields: Object.keys(req.body) },
      }
    });

    logger.info(`User preferences updated for user ${id} by ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: updatedPreferences }
    });

  } catch (error) {
    logger.error('Update user preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private (Admin only)
router.get('/stats', [
  authorize('ADMIN'),
], async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    // Get total users
    const total = await prisma.user.count();

    // Get active users
    const active = await prisma.user.count({
      where: { isActive: true }
    });

    // Get users by role
    const byRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Format role statistics
    const roleStats = {};
    byRole.forEach(item => {
      roleStats[item.role] = item._count.role;
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        newUsers,
        byRole: roleStats,
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
