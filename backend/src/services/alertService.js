const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cron = require('node-cron');
const logger = require('../utils/logger');

class AlertService {
  constructor() {
    this.io = null;
    this.prisma = null;
    this.emailTransporter = null;
    this.twilioClient = null;
    this.isInitialized = false;
  }

  async initialize(io, prisma) {
    this.io = io;
    this.prisma = prisma;

    // Initialize email transporter
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      try {
        await this.emailTransporter.verify();
        logger.info('Email service initialized successfully');
      } catch (error) {
        logger.warn('Email service initialization failed:', error.message);
        this.emailTransporter = null;
      }
    }

    // Initialize Twilio client
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      logger.info('SMS service initialized successfully');
    }

    // Start monitoring job
    this.startMonitoring();
    this.isInitialized = true;
    logger.info('Alert service initialized');
  }

  startMonitoring() {
    // Check for threshold violations every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      try {
        await this.checkThresholds();
      } catch (error) {
        logger.error('Threshold monitoring error:', error);
      }
    });

    // Clean up old resolved alerts every day at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        await this.cleanupOldAlerts();
      } catch (error) {
        logger.error('Alert cleanup error:', error);
      }
    });

    logger.info('Alert monitoring jobs scheduled');
  }

  async checkThresholds() {
    if (!this.prisma) return;

    try {
      // Get all active ponds with their latest sensor data and thresholds
      const ponds = await this.prisma.pond.findMany({
        where: { isActive: true },
        include: {
          thresholds: {
            where: { isActive: true }
          },
          sensorData: {
            orderBy: { timestamp: 'desc' },
            take: 1
          },
          farm: {
            include: {
              users: {
                include: {
                  user: {
                    include: {
                      preferences: true
                    }
                  }
                }
              }
            }
          }
        }
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
            farmId: pond.farmId,
            type: 'SENSOR_MALFUNCTION',
            severity: 'HIGH',
            message: `No recent sensor data for ${pond.name}. Last reading was ${Math.round(readingAge / (60 * 1000))} minutes ago.`,
            parameter: null,
            value: null,
            threshold: null,
          });
          continue;
        }

        // Check each threshold
        for (const threshold of pond.thresholds) {
          const parameterKey = threshold.parameter.toLowerCase();
          const currentValue = latestReading[parameterKey];

          if (currentValue === null || currentValue === undefined) continue;

          let alertType = null;
          let severity = null;
          let thresholdValue = null;

          // Check critical thresholds first
          if (threshold.criticalMin !== null && currentValue < threshold.criticalMin) {
            alertType = 'THRESHOLD_EXCEEDED';
            severity = 'CRITICAL';
            thresholdValue = threshold.criticalMin;
          } else if (threshold.criticalMax !== null && currentValue > threshold.criticalMax) {
            alertType = 'THRESHOLD_EXCEEDED';
            severity = 'CRITICAL';
            thresholdValue = threshold.criticalMax;
          }
          // Check normal thresholds
          else if (threshold.minValue !== null && currentValue < threshold.minValue) {
            alertType = 'THRESHOLD_EXCEEDED';
            severity = 'HIGH';
            thresholdValue = threshold.minValue;
          } else if (threshold.maxValue !== null && currentValue > threshold.maxValue) {
            alertType = 'THRESHOLD_EXCEEDED';
            severity = 'HIGH';
            thresholdValue = threshold.maxValue;
          }

          if (alertType) {
            // Check if similar alert already exists and is not resolved
            const existingAlert = await this.prisma.alert.findFirst({
              where: {
                pondId: pond.id,
                parameter: threshold.parameter,
                type: alertType,
                isResolved: false,
                createdAt: {
                  gte: new Date(now - 30 * 60 * 1000) // Within last 30 minutes
                }
              }
            });

            if (!existingAlert) {
              const alert = await this.createAlert({
                pondId: pond.id,
                farmId: pond.farmId,
                type: alertType,
                severity,
                parameter: threshold.parameter,
                value: currentValue,
                threshold: thresholdValue,
                message: this.generateAlertMessage(pond.name, threshold.parameter, currentValue, thresholdValue, severity),
              });

              // Send notifications
              await this.sendNotifications(alert, pond.farm.users);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Threshold checking error:', error);
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
              type: true,
            }
          },
          farm: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      // Emit real-time alert
      if (this.io) {
        this.io.to(`pond_${alert.pondId}`).emit('alert', {
          alert,
          timestamp: new Date(),
        });

        // Also emit to farm channel
        this.io.to(`farm_${alert.farmId}`).emit('alert', {
          alert,
          timestamp: new Date(),
        });
      }

      logger.info(`Alert created: ${alert.type} for pond ${alert.pond.name}`);
      return alert;
    } catch (error) {
      logger.error('Create alert error:', error);
      throw error;
    }
  }

  async sendNotifications(alert, farmUsers) {
    for (const farmUser of farmUsers) {
      const user = farmUser.user;
      const preferences = user.preferences;

      if (!preferences) continue;

      // Check if user wants this severity level
      const severityLevels = ['low', 'medium', 'high', 'critical'];
      const userSeverityIndex = severityLevels.indexOf(preferences.alertSeverity);
      const alertSeverityIndex = severityLevels.indexOf(alert.severity.toLowerCase());

      if (alertSeverityIndex < userSeverityIndex) continue;

      // Send email notification
      if (preferences.emailAlerts && this.emailTransporter) {
        try {
          await this.sendEmail(user.email, alert);
        } catch (error) {
          logger.error(`Email notification failed for ${user.email}:`, error);
        }
      }

      // Send SMS notification
      if (preferences.smsAlerts && this.twilioClient && user.phone) {
        try {
          await this.sendSMS(user.phone, alert);
        } catch (error) {
          logger.error(`SMS notification failed for ${user.phone}:`, error);
        }
      }
    }
  }

  async sendEmail(email, alert) {
    if (!this.emailTransporter) return;

    const subject = `🚨 Alert: ${alert.severity} - ${alert.pond.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${this.getSeverityColor(alert.severity)};">
          ${alert.severity} Alert
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${alert.pond.name}</h3>
          <p><strong>Farm:</strong> ${alert.farm.name}</p>
          <p><strong>Alert Type:</strong> ${alert.type.replace('_', ' ')}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          ${alert.parameter ? `<p><strong>Parameter:</strong> ${alert.parameter}</p>` : ''}
          ${alert.value ? `<p><strong>Current Value:</strong> ${alert.value}</p>` : ''}
          ${alert.threshold ? `<p><strong>Threshold:</strong> ${alert.threshold}</p>` : ''}
          <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This is an automated alert from your Aquaculture Monitoring System.
          Please check your dashboard for more details.
        </p>
      </div>
    `;

    await this.emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });

    logger.info(`Email alert sent to ${email}`);
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
      TEMPERATURE: 'Temperature',
      PH: 'pH',
      OXYGEN: 'Dissolved Oxygen',
      SALINITY: 'Salinity',
      TURBIDITY: 'Turbidity',
      AMMONIA: 'Ammonia',
      NITRITE: 'Nitrite',
      NITRATE: 'Nitrate',
    };

    const parameterName = parameterNames[parameter] || parameter;
    const direction = value < threshold ? 'below' : 'above';
    
    if (severity === 'CRITICAL') {
      return `🚨 CRITICAL: ${parameterName} in ${pondName} is ${direction} critical threshold (${value} vs ${threshold})`;
    } else {
      return `⚠️ WARNING: ${parameterName} in ${pondName} is ${direction} safe threshold (${value} vs ${threshold})`;
    }
  }

  getSeverityColor(severity) {
    const colors = {
      LOW: '#28a745',
      MEDIUM: '#ffc107',
      HIGH: '#fd7e14',
      CRITICAL: '#dc3545',
    };
    return colors[severity] || '#6c757d';
  }

  async cleanupOldAlerts() {
    try {
      // Delete resolved alerts older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await this.prisma.alert.deleteMany({
        where: {
          isResolved: true,
          resolvedAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      logger.info(`Cleaned up ${result.count} old resolved alerts`);
    } catch (error) {
      logger.error('Alert cleanup error:', error);
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
        }
      });

      // Log activity
      await this.prisma.activityLog.create({
        data: {
          userId,
          action: 'resolve_alert',
          entity: 'alert',
          entityId: alertId,
          details: { alertType: alert.type, severity: alert.severity },
        }
      });

      return alert;
    } catch (error) {
      logger.error('Resolve alert error:', error);
      throw error;
    }
  }
}

module.exports = new AlertService();
