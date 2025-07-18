const express = require("express");
const { body, validationResult, param, query } = require("express-validator");
const { auth, authorize } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/sensors/data/:pondId
// @desc    Get sensor data for a pond
// @access  Private
router.get(
  "/data/:pondId",
  [
    param("pondId").isString().withMessage("Pond ID must be a string"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO date"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Limit must be between 1 and 1000"),
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

      const { pondId } = req.params;
      const { startDate, endDate, limit = 100 } = req.query;
      const prisma = req.app.get("prisma");

      // Check if user has access to this pond
      const pond = await prisma.pond.findFirst({
        where: {
          id: pondId,
          isActive: true,
          farm: {
            users: {
              some: {
                userId: req.user.userId,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      if (!pond) {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      // Build date filter
      const dateFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      // Get sensor data with Prisma
      const sensorData = await prisma.sensorData.findMany({
        where: {
          pondId,
          ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
        },
        orderBy: {
          timestamp: "desc",
        },
        take: parseInt(limit),
      });

      res.json({
        success: true,
        data: {
          sensorData,
          pond,
        },
      });
    } catch (error) {
      logger.error("Get sensor data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sensor data",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/sensors/data
// @desc    Add new sensor reading
// @access  Private (Technicians and above)
router.post(
  "/data",
  [
    authorize("TECHNICIAN", "FARMER", "ADMIN"),
    body("pondId").isString().withMessage("Pond ID must be a string"),
    body("temperature")
      .optional()
      .isFloat({ min: -10, max: 50 })
      .withMessage("Temperature must be between -10 and 50°C"),
    body("ph")
      .optional()
      .isFloat({ min: 0, max: 14 })
      .withMessage("pH must be between 0 and 14"),
    body("oxygen")
      .optional()
      .isFloat({ min: 0, max: 20 })
      .withMessage("Oxygen level must be between 0 and 20 mg/L"),
    body("salinity")
      .optional()
      .isFloat({ min: 0, max: 50 })
      .withMessage("Salinity must be between 0 and 50 ppt"),
    body("turbidity")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Turbidity must be a positive number"),
    body("ammonia")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Ammonia must be a positive number"),
    body("nitrite")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Nitrite must be a positive number"),
    body("nitrate")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Nitrate must be a positive number"),
    body("waterLevel")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Water level must be a positive number"),
    body("flowRate")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Flow rate must be a positive number"),
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

      const {
        pondId,
        temperature,
        ph,
        oxygen,
        salinity,
        turbidity,
        ammonia,
        nitrite,
        nitrate,
        waterLevel,
        flowRate,
      } = req.body;

      const prisma = req.app.get("prisma");

      // Check if user has access to this pond
      const pond = await prisma.pond.findFirst({
        where: {
          id: pondId,
          isActive: true,
          farm: {
            users: {
              some: {
                userId: req.user.userId,
              },
            },
          },
        },
        include: {
          farm: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!pond) {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      // Create sensor reading using Prisma
      const sensorReading = await prisma.sensorData.create({
        data: {
          pondId,
          userId: req.user.userId,
          temperature,
          ph,
          oxygen,
          salinity,
          turbidity,
          ammonia,
          nitrite,
          nitrate,
          waterLevel,
          flowRate,
        },
      });

      // Enhanced alert generation - Check for threshold violations
      const thresholds = await prisma.threshold.findMany({
        where: {
          pondId,
          isActive: true,
        },
      });

      const createdAlerts = [];
      const parameterMapping = {
        temperature,
        ph,
        oxygen,
        salinity,
        turbidity,
        ammonia,
        nitrite,
        nitrate,
        waterLevel,
        flowRate,
      };

      for (const threshold of thresholds) {
        const currentValue = parameterMapping[threshold.parameter];

        if (currentValue !== undefined && currentValue !== null) {
          let alertSeverity = null;
          let thresholdValue = null;
          let alertMessage = null;

          // Check critical thresholds first
          if (
            threshold.optimalMin !== null &&
            currentValue < threshold.optimalMin
          ) {
            alertSeverity = "CRITICAL";
            thresholdValue = threshold.optimalMin;
            alertMessage = `🚨 CRITICAL: ${threshold.parameter.replace(
              "_",
              " "
            )} in ${pond.name} is critically low (${currentValue} < ${
              threshold.optimalMin
            })`;
          } else if (
            threshold.optimalMax !== null &&
            currentValue > threshold.optimalMax
          ) {
            alertSeverity = "CRITICAL";
            thresholdValue = threshold.optimalMax;
            alertMessage = `🚨 CRITICAL: ${threshold.parameter.replace(
              "_",
              " "
            )} in ${pond.name} is critically high (${currentValue} > ${
              threshold.optimalMax
            })`;
          }
          // Check normal thresholds
          else if (
            threshold.minValue !== null &&
            currentValue < threshold.minValue
          ) {
            alertSeverity = "HIGH";
            thresholdValue = threshold.minValue;
            alertMessage = `⚠️ WARNING: ${threshold.parameter.replace(
              "_",
              " "
            )} in ${pond.name} is below safe threshold (${currentValue} < ${
              threshold.minValue
            })`;
          } else if (
            threshold.maxValue !== null &&
            currentValue > threshold.maxValue
          ) {
            alertSeverity = "HIGH";
            thresholdValue = threshold.maxValue;
            alertMessage = `⚠️ WARNING: ${threshold.parameter.replace(
              "_",
              " "
            )} in ${pond.name} is above safe threshold (${currentValue} > ${
              threshold.maxValue
            })`;
          }

          if (alertSeverity && alertMessage) {
            // Check if similar alert already exists and is not resolved (within last 30 minutes)
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const existingAlert = await prisma.alert.findFirst({
              where: {
                pondId,
                parameter: threshold.parameter,
                isResolved: false,
                createdAt: {
                  gte: thirtyMinutesAgo,
                },
              },
            });

            if (!existingAlert) {
              // Create new alert using Prisma
              const newAlert = await prisma.alert.create({
                data: {
                  pondId,
                  farmId: pond.farmId,
                  userId: req.user.userId,
                  type: "THRESHOLD_EXCEEDED",
                  severity: alertSeverity,
                  parameter: threshold.parameter,
                  value: currentValue,
                  threshold: thresholdValue,
                  message: alertMessage,
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
              });

              createdAlerts.push(newAlert);

              logger.info(
                `${alertSeverity} alert created for ${threshold.parameter} in pond ${pond.name}: ${currentValue} vs threshold ${thresholdValue}`
              );
            }
          }
        }
      }

      // Emit real-time data to connected clients
      const io = req.app.get("io");
      if (io) {
        // Emit sensor data
        io.to(`pond_${pondId}`).emit("sensorData", {
          pondId,
          data: sensorReading,
          pond: {
            id: pond.id,
            name: pond.name,
            type: pond.type,
            farmId: pond.farmId,
          },
        });

        // Emit alerts if any were created
        if (createdAlerts.length > 0) {
          createdAlerts.forEach((alert) => {
            io.to(`pond_${pondId}`).emit("alert", {
              alert,
              timestamp: new Date(),
            });

            // Also emit to farm channel
            io.to(`farm_${pond.farmId}`).emit("alert", {
              alert,
              timestamp: new Date(),
            });
          });
        }
      }

      // Log activity using Prisma
      await prisma.userActivity.create({
        data: {
          userId: req.user.userId,
          action: "SENSOR_DATA_ADDED",
          resource: "sensor_data",
          resourceId: sensorReading.id,
          metadata: {
            pondId,
            pondName: pond.name,
            parameters: {
              temperature,
              ph,
              oxygen,
              salinity,
              turbidity,
              ammonia,
              nitrite,
              nitrate,
            },
            alertsGenerated: createdAlerts.length,
          },
        },
      });

      logger.info(
        `Sensor data added for pond ${pond.name} by user ${req.user.userId}. ${createdAlerts.length} alerts generated.`
      );

      res.status(201).json({
        success: true,
        message: `Sensor data recorded successfully${
          createdAlerts.length > 0
            ? ` with ${createdAlerts.length} alert(s) generated`
            : ""
        }`,
        data: {
          sensorReading,
          alertsGenerated: createdAlerts.length,
          alerts: createdAlerts,
        },
      });
    } catch (error) {
      logger.error("Add sensor data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to record sensor data",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/sensors/stats/:pondId
// @desc    Get statistics for sensor data
// @access  Private
router.get(
  "/stats/:pondId",
  [
    param("pondId").isString().withMessage("Pond ID must be a string"),
    query("period")
      .optional()
      .isIn(["day", "week", "month"])
      .withMessage("Period must be day, week, or month"),
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

      const { pondId } = req.params;
      const { period = "day" } = req.query;
      const prisma = req.app.get("prisma");

      // Check if user has access to this pond
      const pond = await prisma.pond.findFirst({
        where: {
          id: pondId,
          isActive: true,
          farm: {
            users: {
              some: {
                userId: req.user.userId,
              },
            },
          },
        },
      });

      if (!pond) {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate;

      switch (period) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
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
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      if (sensorData.length === 0) {
        return res.json({
          success: true,
          data: {
            period,
            count: 0,
            stats: null,
            trends: null,
          },
        });
      }

      // Calculate statistics
      const calculateStats = (values) => {
        const validValues = values.filter((v) => v !== null && v !== undefined);
        if (validValues.length === 0)
          return { min: 0, max: 0, avg: 0, current: 0 };

        return {
          min: Math.min(...validValues),
          max: Math.max(...validValues),
          avg:
            Math.round(
              (validValues.reduce((sum, val) => sum + val, 0) /
                validValues.length) *
                100
            ) / 100,
          current: validValues[0] || 0,
        };
      };

      const stats = {
        temperature: calculateStats(sensorData.map((d) => d.temperature)),
        ph: calculateStats(sensorData.map((d) => d.ph)),
        oxygen: calculateStats(sensorData.map((d) => d.oxygen)),
        salinity: calculateStats(sensorData.map((d) => d.salinity)),
        turbidity: calculateStats(sensorData.map((d) => d.turbidity)),
        ammonia: calculateStats(sensorData.map((d) => d.ammonia)),
        nitrite: calculateStats(sensorData.map((d) => d.nitrite)),
        nitrate: calculateStats(sensorData.map((d) => d.nitrate)),
      };

      // Calculate trends (first vs last reading)
      let trends = null;
      if (sensorData.length >= 2) {
        const first = sensorData[sensorData.length - 1];
        const last = sensorData[0];

        trends = {
          temperature:
            last.temperature && first.temperature
              ? Math.round((last.temperature - first.temperature) * 100) / 100
              : 0,
          ph:
            last.ph && first.ph
              ? Math.round((last.ph - first.ph) * 100) / 100
              : 0,
          oxygen:
            last.oxygen && first.oxygen
              ? Math.round((last.oxygen - first.oxygen) * 100) / 100
              : 0,
          salinity:
            last.salinity && first.salinity
              ? Math.round((last.salinity - first.salinity) * 100) / 100
              : 0,
        };
      }

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
          },
        },
      });
    } catch (error) {
      logger.error("Get sensor stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sensor statistics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/sensors/latest/:pondId
// @desc    Get latest sensor reading for a pond
// @access  Private
router.get(
  "/latest/:pondId",
  [param("pondId").isString().withMessage("Pond ID must be a string")],
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

      const { pondId } = req.params;
      const prisma = req.app.get("prisma");

      // Check if user has access to this pond
      const pond = await prisma.pond.findFirst({
        where: {
          id: pondId,
          isActive: true,
          farm: {
            users: {
              some: {
                userId: req.user.userId,
              },
            },
          },
        },
      });

      if (!pond) {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      // Get latest sensor reading
      const sensorReading = await prisma.sensorData.findFirst({
        where: {
          pondId,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      if (!sensorReading) {
        return res.json({
          success: true,
          data: {
            sensorReading: null,
            message: "No sensor data available for this pond",
          },
        });
      }

      res.json({
        success: true,
        data: {
          sensorReading,
          pond: {
            id: pond.id,
            name: pond.name,
            type: pond.type,
          },
        },
      });
    } catch (error) {
      logger.error("Get latest sensor data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get latest sensor data",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   DELETE /api/sensors/data/:id
// @desc    Delete sensor reading (Admin only)
// @access  Private (Admin only)
router.delete(
  "/data/:id",
  [
    authorize("ADMIN"),
    param("id").isString().withMessage("Sensor data ID must be a string"),
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

      const { id } = req.params;
      const prisma = req.app.get("prisma");

      // Check if sensor reading exists
      const sensorReading = await prisma.sensorData.findUnique({
        where: { id },
        include: {
          pond: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!sensorReading) {
        return res.status(404).json({
          success: false,
          message: "Sensor reading not found",
        });
      }

      // Delete sensor reading
      await prisma.sensorData.delete({
        where: { id },
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user.userId,
          action: "SENSOR_DATA_DELETED",
          resource: "sensor_data",
          resourceId: id,
          metadata: {
            pondId: sensorReading.pondId,
            pondName: sensorReading.pond.name,
          },
        },
      });

      logger.info(`Sensor data deleted: ${id} by admin ${req.user.userId}`);

      res.json({
        success: true,
        message: "Sensor reading deleted successfully",
      });
    } catch (error) {
      logger.error("Delete sensor data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete sensor reading",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
