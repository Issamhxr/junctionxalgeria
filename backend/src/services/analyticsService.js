const prisma = require("../database/prisma");

class AnalyticsService {
  /**
   * Get dashboard analytics for a specific user
   */
  async getDashboardAnalytics(userId) {
    try {
      // Get user's farms
      const userFarms = await prisma.farmUser.findMany({
        where: { userId },
        include: {
          farm: {
            include: {
              ponds: true,
            },
          },
        },
      });

      const farmIds = userFarms.map((uf) => uf.farmId);
      const pondIds = userFarms.flatMap((uf) => uf.farm.ponds.map((p) => p.id));

      // Get basic counts
      const totalFarms = userFarms.length;
      const totalPonds = pondIds.length;

      // Get active alerts
      const activeAlerts = await prisma.alert.findMany({
        where: {
          farmId: { in: farmIds },
          isResolved: false,
        },
        include: {
          pond: true,
          farm: true,
        },
      });

      // Get critical alerts
      const criticalAlerts = activeAlerts.filter(
        (alert) => alert.severity === "CRITICAL"
      );

      // Get recent sensor data for all ponds
      const recentSensorData = await prisma.sensorData.findMany({
        where: {
          pondId: { in: pondIds },
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { timestamp: "desc" },
        take: 100,
      });

      // Calculate average parameters
      const avgParams = this.calculateAverageParameters(recentSensorData);

      // Get pond health status
      const pondHealthStatus = await this.getPondHealthStatus(pondIds);

      // Get alert trends (last 7 days)
      const alertTrends = await this.getAlertTrends(farmIds, 7);

      // Get sensor data trends
      const sensorTrends = await this.getSensorDataTrends(pondIds, 7);

      return {
        summary: {
          totalFarms,
          totalPonds,
          activeAlerts: activeAlerts.length,
          criticalAlerts: criticalAlerts.length,
          averageParameters: avgParams,
          lastUpdated: new Date(),
        },
        alerts: {
          active: activeAlerts.slice(0, 10), // Latest 10 alerts
          critical: criticalAlerts,
          trends: alertTrends,
        },
        ponds: {
          healthStatus: pondHealthStatus,
          sensorTrends: sensorTrends,
        },
        farms: userFarms.map((uf) => ({
          id: uf.farm.id,
          name: uf.farm.name,
          location: uf.farm.location,
          pondsCount: uf.farm.ponds.length,
          role: uf.role,
        })),
      };
    } catch (error) {
      console.error("Error getting dashboard analytics:", error);
      throw error;
    }
  }

  /**
   * Calculate average parameters from sensor data
   */
  calculateAverageParameters(sensorData) {
    if (sensorData.length === 0) {
      return {
        temperature: 0,
        ph: 0,
        oxygen: 0,
        salinity: 0,
      };
    }

    const totals = sensorData.reduce(
      (acc, data) => {
        acc.temperature += data.temperature || 0;
        acc.ph += data.ph || 0;
        acc.oxygen += data.oxygen || 0;
        acc.salinity += data.salinity || 0;
        return acc;
      },
      { temperature: 0, ph: 0, oxygen: 0, salinity: 0 }
    );

    const count = sensorData.length;
    return {
      temperature: Math.round((totals.temperature / count) * 10) / 10,
      ph: Math.round((totals.ph / count) * 10) / 10,
      oxygen: Math.round((totals.oxygen / count) * 10) / 10,
      salinity: Math.round((totals.salinity / count) * 10) / 10,
    };
  }

  /**
   * Get pond health status
   */
  async getPondHealthStatus(pondIds) {
    const ponds = await prisma.pond.findMany({
      where: { id: { in: pondIds } },
      include: {
        sensorData: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        thresholds: true,
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return ponds.map((pond) => {
      const latestData = pond.sensorData[0];
      const activeAlerts = pond.alerts.length;
      const criticalAlerts = pond.alerts.filter(
        (a) => a.severity === "CRITICAL"
      ).length;

      let healthStatus = "good";
      if (criticalAlerts > 0) {
        healthStatus = "critical";
      } else if (activeAlerts > 0) {
        healthStatus = "warning";
      }

      return {
        id: pond.id,
        name: pond.name,
        healthStatus,
        activeAlerts,
        criticalAlerts,
        lastReading: latestData ? latestData.timestamp : null,
        currentParameters: latestData
          ? {
              temperature: latestData.temperature,
              ph: latestData.ph,
              oxygen: latestData.oxygen,
              salinity: latestData.salinity,
            }
          : null,
      };
    });
  }

  /**
   * Get alert trends for the last N days
   */
  async getAlertTrends(farmIds, days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await prisma.alert.findMany({
      where: {
        farmId: { in: farmIds },
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group alerts by day
    const dailyAlerts = {};
    alerts.forEach((alert) => {
      const day = alert.createdAt.toISOString().split("T")[0];
      if (!dailyAlerts[day]) {
        dailyAlerts[day] = {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        };
      }
      dailyAlerts[day].total++;
      dailyAlerts[day][alert.severity.toLowerCase()]++;
    });

    return Object.entries(dailyAlerts).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }

  /**
   * Get sensor data trends
   */
  async getSensorDataTrends(pondIds, days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sensorData = await prisma.sensorData.findMany({
      where: {
        pondId: { in: pondIds },
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: "asc" },
    });

    // Group by hour for better granularity
    const hourlyData = {};
    sensorData.forEach((data) => {
      const hour = new Date(data.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();

      if (!hourlyData[key]) {
        hourlyData[key] = {
          timestamp: hour,
          temperature: [],
          ph: [],
          oxygen: [],
          salinity: [],
        };
      }

      hourlyData[key].temperature.push(data.temperature);
      hourlyData[key].ph.push(data.ph);
      hourlyData[key].oxygen.push(data.oxygen);
      hourlyData[key].salinity.push(data.salinity);
    });

    // Calculate averages for each hour
    return Object.values(hourlyData).map((hour) => ({
      timestamp: hour.timestamp,
      temperature:
        hour.temperature.reduce((a, b) => a + b, 0) / hour.temperature.length,
      ph: hour.ph.reduce((a, b) => a + b, 0) / hour.ph.length,
      oxygen: hour.oxygen.reduce((a, b) => a + b, 0) / hour.oxygen.length,
      salinity: hour.salinity.reduce((a, b) => a + b, 0) / hour.salinity.length,
    }));
  }

  /**
   * Check if user has access to a specific pond
   */
  async checkPondAccess(userId, pondId) {
    try {
      const pond = await prisma.pond.findUnique({
        where: { id: pondId },
        include: {
          farm: {
            include: {
              users: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!pond) {
        return { hasAccess: false, reason: "Pond not found" };
      }

      if (pond.farm.users.length === 0) {
        return {
          hasAccess: false,
          reason: "Access denied - not a member of this farm",
        };
      }

      return { hasAccess: true, pond, userRole: pond.farm.users[0].role };
    } catch (error) {
      console.error("Error checking pond access:", error);
      return { hasAccess: false, reason: "Error checking access" };
    }
  }

  /**
   * Get detailed pond analytics
   */
  async getPondAnalytics(pondId, days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const pond = await prisma.pond.findUnique({
        where: { id: pondId },
        include: {
          sensorData: {
            where: { timestamp: { gte: startDate } },
            orderBy: { timestamp: "asc" },
          },
          alerts: {
            where: { createdAt: { gte: startDate } },
            orderBy: { createdAt: "desc" },
          },
          thresholds: true,
        },
      });

      if (!pond) {
        throw new Error("Pond not found");
      }

      // Calculate parameter statistics
      const paramStats = this.calculateParameterStatistics(pond.sensorData);

      // Get threshold violations
      const thresholdViolations = this.getThresholdViolations(
        pond.sensorData,
        pond.thresholds
      );

      return {
        pond: {
          id: pond.id,
          name: pond.name,
          type: pond.type,
          volume: pond.volume,
          depth: pond.depth,
        },
        statistics: paramStats,
        thresholds: pond.thresholds,
        violations: thresholdViolations,
        alerts: pond.alerts,
        sensorData: pond.sensorData,
      };
    } catch (error) {
      console.error("Error getting pond analytics:", error);
      throw error;
    }
  }

  /**
   * Calculate parameter statistics
   */
  calculateParameterStatistics(sensorData) {
    if (sensorData.length === 0) {
      return {};
    }

    const parameters = ["temperature", "ph", "oxygen", "salinity"];
    const stats = {};

    parameters.forEach((param) => {
      const values = sensorData.map((d) => d[param]).filter((v) => v !== null);
      if (values.length > 0) {
        stats[param] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          latest: values[values.length - 1],
        };
      }
    });

    return stats;
  }

  /**
   * Get threshold violations
   */
  getThresholdViolations(sensorData, thresholds) {
    const violations = [];

    sensorData.forEach((data) => {
      thresholds.forEach((threshold) => {
        const value = data[threshold.parameter.toLowerCase()];
        if (value !== null && value !== undefined) {
          if (threshold.minValue !== null && value < threshold.minValue) {
            violations.push({
              timestamp: data.timestamp,
              parameter: threshold.parameter,
              value,
              threshold: threshold.minValue,
              type: "below_min",
            });
          }
          if (threshold.maxValue !== null && value > threshold.maxValue) {
            violations.push({
              timestamp: data.timestamp,
              parameter: threshold.parameter,
              value,
              threshold: threshold.maxValue,
              type: "above_max",
            });
          }
        }
      });
    });

    return violations;
  }
}

module.exports = new AnalyticsService();
