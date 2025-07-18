const express = require("express");
const { param, query, validationResult } = require("express-validator");
const { auth, authorize } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// All routes require authentication

// @route   GET /api/alerts
// @desc    Get alerts for user's farms
// @access  Private
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("severity")
      .optional()
      .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
      .withMessage("Invalid severity"),
    query("isResolved")
      .optional()
      .isBoolean()
      .withMessage("isResolved must be boolean"),
    query("farmId")
      .optional()
      .isString()
      .withMessage("Farm ID must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const prisma = req.app.get("prisma");
      const { page = 1, limit = 20, severity, isResolved, farmId } = req.query;

      // Get user's farms
      const userFarms = await prisma.farmUser.findMany({
        where: { userId: req.user.userId },
        select: { farmId: true },
      });

      const farmIds = userFarms.map((uf) => uf.farmId);

      if (farmIds.length === 0) {
        return res.json({
          success: true,
          data: {
            alerts: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0,
            },
          },
        });
      }

      // Build where clause
      const where = {
        farmId: { in: farmIds },
      };

      if (farmId) {
        where.farmId = farmId;
      }

      if (severity) {
        where.severity = severity;
      }

      if (isResolved !== undefined) {
        where.isResolved = isResolved === "true";
      }

      // Get total count
      const total = await prisma.alert.count({ where });

      // Get alerts
      const alerts = await prisma.alert.findMany({
        where,
        include: {
          pond: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          farm: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      });

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      logger.error("Get alerts error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get alerts",
        error: process.env.NODE_ENV === "development" ? error.message : u,
      });
    }
  }
);

// @route   GET /api/alerts/active
// @desc    Get active (unresolved) alerts
// @access  Private
router.get("/active", async (req, res) => {
  try {
    const prisma = req.app.get("prisma");

    // Get user's farms
    const userFarms = await prisma.farmUser.findMany({
      where: { userId: req.user.userId },
      select: { farmId: true },
    });

    const farmIds = userFarms.map((uf) => uf.farmId);

    if (farmIds.length === 0) {
      return res.json({
        success: true,
        data: { alerts: [] },
      });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        farmId: { in: farmIds },
        isResolved: false,
      },
      include: {
        pond: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    res.json({
      success: true,
      data: { alerts },
    });
  } catch (error) {
    logger.error("Get active alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active alerts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/alerts/acknowledge/:id
// @desc    Mark alert as read
// @access  Private
router.post(
  "/acknowledge/:id",
  [param("id").isString().withMessage("Alert ID must be a string")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const prisma = req.app.get("prisma");
      const { id } = req.params;

      // Check if alert exists and user has access
      const alert = await prisma.alert.findFirst({
        where: {
          id,
          farm: {
            users: {
              some: {
                userId: req.user.userId,
              },
            },
          },
        },
      });

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: "Alert not found or access denied",
        });
      }

      // Mark as read
      const updatedAlert = await prisma.alert.update({
        where: { id },
        data: { isRead: true },
        include: {
          pond: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: "acknowledge_alert",
          entity: "alert",
          entityId: id,
          details: { alertType: alert.type, severity: alert.severity },
        },
      });

      logger.info(`Alert acknowledged: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: "Alert acknowledged",
        data: { alert: updatedAlert },
      });
    } catch (error) {
      logger.error("Acknowledge alert error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to acknowledge alert",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/alerts/resolve/:id
// @desc    Mark alert as resolved
// @access  Private (Farmers and above)
router.post(
  "/resolve/:id",
  [
    authorize("FARMER", "ADMIN"),
    param("id").isString().withMessage("Alert ID must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const prisma = req.app.get("prisma");
      const { id } = req.params;

      // Check if alert exists and user has access
      const alert = await prisma.alert.findFirst({
        where: {
          id,
          farm: {
            users: {
              some: {
                userId: req.user.userId,
                role: { in: ["owner", "manager"] },
              },
            },
          },
        },
      });

      if (!alert && req.user.role !== "ADMIN") {
        return res.status(404).json({
          success: false,
          message: "Alert not found or access denied",
        });
      }

      // Mark as resolved
      const updatedAlert = await prisma.alert.update({
        where: { id },
        data: {
          isResolved: true,
          isRead: true,
          resolvedAt: new Date(),
        },
        include: {
          pond: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action: "resolve_alert",
          entity: "alert",
          entityId: id,
          details: { alertType: alert.type, severity: alert.severity },
        },
      });

      logger.info(`Alert resolved: ${id} by user ${req.user.userId}`);

      res.json({
        success: true,
        message: "Alert resolved",
        data: { alert: updatedAlert },
      });
    } catch (error) {
      logger.error("Resolve alert error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resolve alert",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/alerts/stats
// @desc    Get alert statistics
// @access  Private
router.get("/stats", async (req, res) => {
  try {
    const prisma = req.app.get("prisma");

    // Get user's farms
    const userFarms = await prisma.farmUser.findMany({
      where: { userId: req.user.userId },
      select: { farmId: true },
    });

    const farmIds = userFarms.map((uf) => uf.farmId);

    if (farmIds.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          bySeverity: {},
          byType: {},
          resolved: 0,
        },
      });
    }

    // Get total alerts
    const total = await prisma.alert.count({
      where: { farmId: { in: farmIds } },
    });

    // Get active alerts
    const active = await prisma.alert.count({
      where: {
        farmId: { in: farmIds },
        isResolved: false,
      },
    });

    // Get resolved alerts
    const resolved = await prisma.alert.count({
      where: {
        farmId: { in: farmIds },
        isResolved: true,
      },
    });

    // Get alerts by severity
    const bySeverity = await prisma.alert.groupBy({
      by: ["severity"],
      where: {
        farmId: { in: farmIds },
        isResolved: false,
      },
      _count: { severity: true },
    });

    // Get alerts by type
    const byType = await prisma.alert.groupBy({
      by: ["type"],
      where: {
        farmId: { in: farmIds },
        isResolved: false,
      },
      _count: { type: true },
    });

    // Format results
    const severityStats = {};
    bySeverity.forEach((item) => {
      severityStats[item.severity] = item._count.severity;
    });

    const typeStats = {};
    byType.forEach((item) => {
      typeStats[item.type] = item._count.type;
    });

    res.json({
      success: true,
      data: {
        total,
        active,
        resolved,
        bySeverity: severityStats,
        byType: typeStats,
      },
    });
  } catch (error) {
    logger.error("Get alert stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get alert statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
