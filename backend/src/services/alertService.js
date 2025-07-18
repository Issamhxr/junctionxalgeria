const twilio = require("twilio");
const cron = require("node-cron");
const logger = require("../utils/logger");

class AlertService {
  constructor() {
    this.io = null;
    this.prisma = null;
    this.twilioClient = null;
    this.isInitialized = false;
  }

  async initialize(io, prisma) {
    this.io = io;
    this.prisma = prisma;

    // Initialize Twilio client with proper validation
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      // Validate that Account SID starts with 'AC'
      if (process.env.TWILIO_ACCOUNT_SID.startsWith("AC")) {
        try {
          this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
          );
          logger.info("SMS service initialized successfully");
        } catch (error) {
          logger.warn("Failed to initialize Twilio client:", error.message);
          logger.info("SMS notifications will be disabled");
        }
      } else {
        logger.warn(
          "Invalid Twilio Account SID format (must start with AC). SMS notifications disabled."
        );
      }
    } else {
      logger.info(
        "Twilio credentials not configured. SMS notifications disabled."
      );
    }

    // Start monitoring job
    this.startMonitoring();
    this.isInitialized = true;
    logger.info("Alert service initialized");
  }

  startMonitoring() {
    // Check for threshold violations every 2 minutes
    cron.schedule("*/2 * * * *", async () => {
      try {
        await this.checkThresholds();
      } catch (error) {
        logger.error("Threshold monitoring error:", error);
      }
    });

    // Clean up old resolved alerts every day at midnight
    cron.schedule("0 0 * * *", async () => {
      try {
        await this.cleanupOldAlerts();
      } catch (error) {
        logger.error("Alert cleanup error:", error);
      }
    });

    logger.info("Alert monitoring jobs scheduled");
  }

  async checkThresholds() {
    if (!this.prisma) return;

    try {
      // Get all active ponds with their latest sensor data
      const ponds = await this.prisma.pond.findMany({
        where: { status: "ACTIVE" },
        include: {
          sensorData: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
          farm: {
            include: {
              users: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      for (const pond of ponds) {
        if (pond.sensorData.length === 0) continue;

        const latestReading = pond.sensorData[0];
        const now = new Date();
        const readingAge = now - new Date(latestReading.timestamp);

        // Check if sensor data is too old (more than 1 hour)
        if (readingAge > 60 * 60 * 1000) {
          await this.createAlert({
            pondId: pond.id,
            userId: pond.userId,
            type: "SENSOR_OFFLINE",
            severity: "HIGH",
            message: `No recent sensor data for ${
              pond.name
            }. Last reading was ${Math.round(
              readingAge / (60 * 1000)
            )} minutes ago.`,
            metadata: {
              parameter: "sensor_offline",
              lastReadingAge: readingAge,
              farmName: pond.farm.name,
            },
          });
          continue;
        }

        // For now, use basic thresholds since we don't have a thresholds table
        // You can expand this once you have the thresholds properly set up
        const basicThresholds = {
          TEMPERATURE: {
            min: 18.0,
            max: 28.0,
            critical: { min: 15.0, max: 32.0 },
          },
          PH: { min: 6.5, max: 8.5, critical: { min: 6.0, max: 9.0 } },
          OXYGEN: { min: 5.0, max: 12.0, critical: { min: 3.0, max: 15.0 } },
          AMMONIA: { min: 0.0, max: 0.5, critical: { min: 0.0, max: 1.0 } },
        };

        // Check each sensor type for threshold violations
        for (const [sensorType, threshold] of Object.entries(basicThresholds)) {
          // Find the latest reading for this sensor type
          const relevantReading = pond.sensorData.find(
            (reading) => reading.sensorType === sensorType
          );

          if (!relevantReading) continue;

          const currentValue = relevantReading.value;
          if (currentValue === null || currentValue === undefined) continue;

          let alertType = null;
          let severity = null;
          let thresholdValue = null;

          // Check critical thresholds first
          if (currentValue < threshold.critical.min) {
            alertType = `${sensorType}_LOW`;
            severity = "CRITICAL";
            thresholdValue = threshold.critical.min;
          } else if (currentValue > threshold.critical.max) {
            alertType = `${sensorType}_HIGH`;
            severity = "CRITICAL";
            thresholdValue = threshold.critical.max;
          }
          // Check normal thresholds
          else if (currentValue < threshold.min) {
            alertType = `${sensorType}_LOW`;
            severity = "HIGH";
            thresholdValue = threshold.min;
          } else if (currentValue > threshold.max) {
            alertType = `${sensorType}_HIGH`;
            severity = "HIGH";
            thresholdValue = threshold.max;
          }

          if (alertType) {
            // Check if similar alert already exists and is not resolved
            const existingAlert = await this.prisma.alert.findFirst({
              where: {
                pondId: pond.id,
                type: alertType,
                isResolved: false,
                createdAt: {
                  gte: new Date(now - 30 * 60 * 1000), // Within last 30 minutes
                },
              },
            });

            if (!existingAlert) {
              const alert = await this.createAlert({
                pondId: pond.id,
                userId: pond.userId,
                type: alertType,
                severity,
                message: this.generateAlertMessage(
                  pond.name,
                  sensorType,
                  currentValue,
                  thresholdValue,
                  severity
                ),
                metadata: {
                  parameter: sensorType,
                  currentValue,
                  thresholdValue,
                  farmName: pond.farm.name,
                },
              });

              // Send notifications
              await this.sendNotifications(alert, pond.farm.users);
            }
          }
        }
      }
    } catch (error) {
      logger.error("Threshold checking error:", error);
    }
  }

  async createAlert(alertData) {
    try {
      const alert = await this.prisma.alert.create({
        data: alertData,
        include: {
          pond: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Emit real-time alert
      if (this.io) {
        this.io.to(`pond_${alert.pondId}`).emit("alert", {
          alert,
          timestamp: new Date(),
        });

        // Also emit to user channel
        this.io.to(`user_${alert.userId}`).emit("alert", {
          alert,
          timestamp: new Date(),
        });
      }

      logger.info(`Alert created: ${alert.type} for pond ${alert.pond.name}`);
      return alert;
    } catch (error) {
      logger.error("Create alert error:", error);
      throw error;
    }
  }

  async sendNotifications(alert, farmUsers) {
    // For now, simplified notification sending since we don't have user preferences
    for (const farmUser of farmUsers) {
      const user = farmUser.user;

      // Send SMS notification if user has phone and Twilio is configured
      if (this.twilioClient && user.phone) {
        try {
          await this.sendSMS(user.phone, alert);
        } catch (error) {
          logger.error(`SMS notification failed for ${user.phone}:`, error);
        }
      }
    }
  }

  async sendSMS(phone, alert) {
    if (!this.twilioClient) return;

    const message = `🚨 ${alert.severity} Alert - ${alert.pond.name}: ${alert.message}`;

    await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    logger.info(`SMS alert sent to ${phone}`);
  }

  generateAlertMessage(pondName, parameter, value, threshold, severity) {
    const parameterNames = {
      TEMPERATURE: "Temperature",
      PH: "pH",
      OXYGEN: "Dissolved Oxygen",
      SALINITY: "Salinity",
      TURBIDITY: "Turbidity",
      AMMONIA: "Ammonia",
      NITRITE: "Nitrite",
      NITRATE: "Nitrate",
    };

    const parameterName = parameterNames[parameter] || parameter;
    const direction = value < threshold ? "below" : "above";

    if (severity === "CRITICAL") {
      return `🚨 CRITICAL: ${parameterName} in ${pondName} is ${direction} critical threshold (${value} vs ${threshold})`;
    } else {
      return `⚠️ WARNING: ${parameterName} in ${pondName} is ${direction} safe threshold (${value} vs ${threshold})`;
    }
  }

  getSeverityColor(severity) {
    const colors = {
      LOW: "#28a745",
      MEDIUM: "#ffc107",
      HIGH: "#fd7e14",
      CRITICAL: "#dc3545",
    };
    return colors[severity] || "#6c757d";
  }

  async cleanupOldAlerts() {
    try {
      // Delete resolved alerts older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.alert.deleteMany({
        where: {
          isResolved: true,
          resolvedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old resolved alerts`);
    } catch (error) {
      logger.error("Alert cleanup error:", error);
    }
  }

  async resolveAlert(alertId, userId) {
    try {
      const alert = await this.prisma.alert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          isRead: true,
          resolvedAt: new Date(),
        },
      });

      // Log activity
      await this.prisma.activityLog.create({
        data: {
          userId,
          action: "resolve_alert",
          entity: "alert",
          entityId: alertId,
          details: { alertType: alert.type, severity: alert.severity },
        },
      });

      return alert;
    } catch (error) {
      logger.error("Resolve alert error:", error);
      throw error;
    }
  }
}

module.exports = new AlertService();
