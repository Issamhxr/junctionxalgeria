const express = require("express");
const { param, query, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth");
const { query: dbQuery } = require("../database/connection");
const logger = require("../utils/logger");

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview data
// @access  Private
router.get("/overview", async (req, res) => {
  try {
    // Get user's farms
    const farmsQuery = `
      SELECT f.ID, f.NAME, f.LOCATION, f.DESCRIPTION, fu.ROLE as user_role
      FROM FARMS f
      JOIN FARM_USERS fu ON f.ID = fu.FARM_ID
      WHERE fu.USER_ID = $1
    `;
    const farmsResult = await dbQuery(farmsQuery, [req.user.userId]);
    const farms = farmsResult.rows;
    const farmIds = farms.map((f) => f.id);

    if (farmIds.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            farms: 0,
            ponds: 0,
            activeAlerts: 0,
            totalSensorReadings: 0,
          },
          farms: [],
          recentActivity: [],
        },
      });
    }

    // Get counts
    const countsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM PONDS WHERE FARM_ID = ANY($1) AND IS_ACTIVE = true) as ponds_count,
        (SELECT COUNT(*) FROM ALERTS WHERE FARM_ID = ANY($1) AND IS_RESOLVED = false) as active_alerts_count,
        (SELECT COUNT(*) FROM SENSOR_DATA sd 
         JOIN PONDS p ON sd.POND_ID = p.ID 
         WHERE p.FARM_ID = ANY($1) AND sd.CREATED_AT >= NOW() - INTERVAL '30 days') as sensor_readings_count
    `;
    const countsResult = await dbQuery(countsQuery, [farmIds]);
    const counts = countsResult.rows[0];

    // Get recent activity
    const activityQuery = `
      SELECT 
        ACTION,
        ENTITY,
        ENTITY_ID,
        DETAILS,
        CREATED_AT
      FROM ACTIVITY_LOGS
      WHERE USER_ID = $1 AND CREATED_AT >= NOW() - INTERVAL '7 days'
      ORDER BY CREATED_AT DESC
      LIMIT 10
    `;
    const activityResult = await dbQuery(activityQuery, [req.user.userId]);

    // Get farms with their pond counts and recent alerts
    const farmsWithDetailsQuery = `
      SELECT 
        f.ID,
        f.NAME,
        f.LOCATION,
        f.DESCRIPTION,
        fu.ROLE as user_role,
        (SELECT COUNT(*) FROM PONDS WHERE FARM_ID = f.ID AND IS_ACTIVE = true) as ponds_count,
        (SELECT COUNT(*) FROM ALERTS WHERE FARM_ID = f.ID AND IS_RESOLVED = false) as alerts_count
      FROM FARMS f
      JOIN FARM_USERS fu ON f.ID = fu.FARM_ID
      WHERE fu.USER_ID = $1
      ORDER BY f.CREATED_AT DESC
      LIMIT 5
    `;
    const farmsWithDetailsResult = await dbQuery(farmsWithDetailsQuery, [
      req.user.userId,
    ]);

    // Get recent ponds for each farm
    const farmsWithPonds = await Promise.all(
      farmsWithDetailsResult.rows.map(async (farm) => {
        const pondsQuery = `
        SELECT 
          p.ID,
          p.NAME,
          p.TYPE,
          sd.TEMPERATURE,
          sd.PH_LEVEL,
          sd.DISSOLVED_OXYGEN,
          sd.SALINITY,
          sd.CREATED_AT as last_reading
        FROM PONDS p
        LEFT JOIN LATERAL (
          SELECT * FROM SENSOR_DATA
          WHERE POND_ID = p.ID
          ORDER BY CREATED_AT DESC
          LIMIT 1
        ) sd ON true
        WHERE p.FARM_ID = $1 AND p.IS_ACTIVE = true
        ORDER BY p.UPDATED_AT DESC
        LIMIT 3
      `;
        const pondsResult = await dbQuery(pondsQuery, [farm.id]);

        return {
          ...farm,
          ponds: pondsResult.rows,
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          farms: farms.length,
          ponds: parseInt(counts.ponds_count),
          activeAlerts: parseInt(counts.active_alerts_count),
          totalSensorReadings: parseInt(counts.sensor_readings_count),
        },
        farms: farmsWithPonds,
        recentActivity: activityResult.rows,
      },
    });
  } catch (error) {
    logger.error("Get dashboard overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard overview",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/dashboard/analytics/:pondId
// @desc    Get detailed analytics for a specific pond
// @access  Private
router.get(
  "/analytics/:pondId",
  [
    param("pondId").isUUID().withMessage("Pond ID must be a valid UUID"),
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
      const { period = "week" } = req.query;

      // Check if user has access to this pond
      const accessQuery = `
      SELECT 
        p.ID,
        p.NAME,
        p.TYPE,
        p.DESCRIPTION,
        f.ID as farm_id,
        f.NAME as farm_name,
        f.LOCATION as farm_location
      FROM PONDS p
      JOIN FARMS f ON p.FARM_ID = f.ID
      JOIN FARM_USERS fu ON f.ID = fu.FARM_ID
      WHERE p.ID = $1 AND fu.USER_ID = $2 AND p.IS_ACTIVE = true
    `;
      const accessResult = await dbQuery(accessQuery, [
        pondId,
        req.user.userId,
      ]);

      if (accessResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      const pond = accessResult.rows[0];

      // Calculate date range
      const now = new Date();
      let startDate, intervalClause;

      switch (period) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          intervalClause = "INTERVAL '1 hour'";
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          intervalClause = "INTERVAL '1 day'";
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          intervalClause = "INTERVAL '1 day'";
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          intervalClause = "INTERVAL '1 day'";
      }

      // Get sensor data for the period
      const sensorDataQuery = `
      SELECT 
        TEMPERATURE,
        PH_LEVEL,
        DISSOLVED_OXYGEN,
        TURBIDITY,
        AMMONIA_LEVEL,
        SALINITY,
        CREATED_AT
      FROM SENSOR_DATA
      WHERE POND_ID = $1 
      AND CREATED_AT >= $2 
      AND CREATED_AT <= $3
      ORDER BY CREATED_AT ASC
    `;
      const sensorDataResult = await dbQuery(sensorDataQuery, [
        pondId,
        startDate,
        now,
      ]);

      // Get alerts for the period
      const alertsQuery = `
      SELECT 
        ID,
        TYPE,
        SEVERITY,
        TITLE,
        MESSAGE,
        PARAMETER,
        CURRENT_VALUE,
        THRESHOLD_VALUE,
        IS_READ,
        IS_RESOLVED,
        CREATED_AT
      FROM ALERTS
      WHERE POND_ID = $1 
      AND CREATED_AT >= $2 
      AND CREATED_AT <= $3
      ORDER BY CREATED_AT DESC
    `;
      const alertsResult = await dbQuery(alertsQuery, [pondId, startDate, now]);

      // Get thresholds
      const thresholdsQuery = `
      SELECT 
        PARAMETER,
        MIN_VALUE,
        MAX_VALUE,
        OPTIMAL_MIN,
        OPTIMAL_MAX,
        IS_ACTIVE
      FROM THRESHOLDS
      WHERE POND_ID = $1 AND IS_ACTIVE = true
    `;
      const thresholdsResult = await dbQuery(thresholdsQuery, [pondId]);

      // Process sensor data for charts
      const sensorData = sensorDataResult.rows;
      const chartData = [];

      // Group data by time intervals
      const groupedData = new Map();
      sensorData.forEach((reading) => {
        const date = new Date(reading.created_at);
        let key;

        if (period === "day") {
          key = `${date.getFullYear()}-${
            date.getMonth() + 1
          }-${date.getDate()}-${date.getHours()}`;
        } else {
          key = `${date.getFullYear()}-${
            date.getMonth() + 1
          }-${date.getDate()}`;
        }

        if (!groupedData.has(key)) {
          groupedData.set(key, []);
        }
        groupedData.get(key).push(reading);
      });

      // Calculate averages for each time period
      groupedData.forEach((readings, key) => {
        const avgData = {
          timestamp: readings[0].created_at,
          temperature:
            readings.reduce((sum, r) => sum + (r.temperature || 0), 0) /
            readings.length,
          ph_level:
            readings.reduce((sum, r) => sum + (r.ph_level || 0), 0) /
            readings.length,
          dissolved_oxygen:
            readings.reduce((sum, r) => sum + (r.dissolved_oxygen || 0), 0) /
            readings.length,
          salinity:
            readings.reduce((sum, r) => sum + (r.salinity || 0), 0) /
            readings.length,
          turbidity:
            readings.reduce((sum, r) => sum + (r.turbidity || 0), 0) /
            readings.length,
          ammonia_level:
            readings.reduce((sum, r) => sum + (r.ammonia_level || 0), 0) /
            readings.length,
          count: readings.length,
        };

        // Round to 2 decimal places
        Object.keys(avgData).forEach((key) => {
          if (typeof avgData[key] === "number" && key !== "count") {
            avgData[key] = Math.round(avgData[key] * 100) / 100;
          }
        });

        chartData.push(avgData);
      });

      // Calculate parameter compliance
      const compliance = {};
      const thresholdMap = {};

      thresholdsResult.rows.forEach((threshold) => {
        thresholdMap[threshold.parameter] = threshold;
      });

      [
        "temperature",
        "ph_level",
        "dissolved_oxygen",
        "salinity",
        "turbidity",
        "ammonia_level",
      ].forEach((param) => {
        const threshold = thresholdMap[param];

        if (threshold && sensorData.length > 0) {
          const paramValues = sensorData
            .map((d) => d[param])
            .filter((v) => v !== null);
          const withinRange = paramValues.filter(
            (value) =>
              value >= threshold.min_value && value <= threshold.max_value
          ).length;

          compliance[param] = {
            percentage:
              paramValues.length > 0
                ? Math.round((withinRange / paramValues.length) * 100)
                : 0,
            withinRange,
            total: paramValues.length,
            threshold: {
              min: threshold.min_value,
              max: threshold.max_value,
              optimalMin: threshold.optimal_min,
              optimalMax: threshold.optimal_max,
            },
          };
        } else {
          compliance[param] = {
            percentage: 0,
            withinRange: 0,
            total: 0,
            threshold: null,
          };
        }
      });

      // Calculate trends
      const trends = {};
      if (sensorData.length >= 2) {
        const recent = sensorData.slice(-10);
        const older = sensorData.slice(-20, -10);

        if (older.length > 0) {
          ["temperature", "ph_level", "dissolved_oxygen", "salinity"].forEach(
            (param) => {
              const recentAvg =
                recent.reduce((sum, r) => sum + (r[param] || 0), 0) /
                recent.length;
              const olderAvg =
                older.reduce((sum, r) => sum + (r[param] || 0), 0) /
                older.length;
              const change = recentAvg - olderAvg;

              trends[param] = {
                change: Math.round(change * 100) / 100,
                direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
                percentage:
                  olderAvg !== 0
                    ? Math.round((change / olderAvg) * 100 * 100) / 100
                    : 0,
              };
            }
          );
        }
      }

      res.json({
        success: true,
        data: {
          pond: {
            id: pond.id,
            name: pond.name,
            type: pond.type,
            farm: {
              id: pond.farm_id,
              name: pond.farm_name,
              location: pond.farm_location,
            },
          },
          period,
          dateRange: {
            start: startDate,
            end: now,
          },
          chartData,
          compliance,
          trends,
          alerts: alertsResult.rows.slice(0, 10),
          summary: {
            totalReadings: sensorData.length,
            totalAlerts: alertsResult.rows.length,
            unresolvedAlerts: alertsResult.rows.filter((a) => !a.is_resolved)
              .length,
          },
        },
      });
    } catch (error) {
      logger.error("Get pond analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get pond analytics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/dashboard/farms
// @desc    Get farms summary for dashboard
// @access  Private
router.get("/farms", async (req, res) => {
  try {
    // Get user's farms with detailed information
    const farmsQuery = `
      SELECT 
        f.ID,
        f.NAME,
        f.LOCATION,
        f.DESCRIPTION,
        f.LATITUDE,
        f.LONGITUDE,
        f.AREA,
        f.CONTACT_EMAIL,
        f.CONTACT_PHONE,
        f.CREATED_AT,
        fu.ROLE as user_role,
        (SELECT COUNT(*) FROM PONDS WHERE FARM_ID = f.ID AND IS_ACTIVE = true) as ponds_count,
        (SELECT COUNT(*) FROM ALERTS WHERE FARM_ID = f.ID AND IS_RESOLVED = false) as alerts_count
      FROM FARMS f
      JOIN FARM_USERS fu ON f.ID = fu.FARM_ID
      WHERE fu.USER_ID = $1
      ORDER BY f.CREATED_AT DESC
    `;
    const farmsResult = await dbQuery(farmsQuery, [req.user.userId]);

    // Get ponds for each farm
    const farms = await Promise.all(
      farmsResult.rows.map(async (farm) => {
        const pondsQuery = `
        SELECT 
          p.ID,
          p.NAME,
          p.TYPE,
          p.UPDATED_AT,
          sd.TEMPERATURE,
          sd.PH_LEVEL,
          sd.DISSOLVED_OXYGEN,
          sd.SALINITY,
          sd.CREATED_AT as last_reading
        FROM PONDS p
        LEFT JOIN LATERAL (
          SELECT * FROM SENSOR_DATA
          WHERE POND_ID = p.ID
          ORDER BY CREATED_AT DESC
          LIMIT 1
        ) sd ON true
        WHERE p.FARM_ID = $1 AND p.IS_ACTIVE = true
        ORDER BY p.UPDATED_AT DESC
      `;
        const pondsResult = await dbQuery(pondsQuery, [farm.id]);

        return {
          ...farm,
          ponds: pondsResult.rows,
        };
      })
    );

    res.json({
      success: true,
      data: { farms },
    });
  } catch (error) {
    logger.error("Get farms summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get farms summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/dashboard/activity
// @desc    Get recent activity for dashboard
// @access  Private
router.get(
  "/activity",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
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

      const { limit = 20 } = req.query;

      const activitiesQuery = `
      SELECT 
        ACTION,
        ENTITY,
        ENTITY_ID,
        DETAILS,
        IP_ADDRESS,
        USER_AGENT,
        CREATED_AT
      FROM ACTIVITY_LOGS
      WHERE USER_ID = $1 
      AND CREATED_AT >= NOW() - INTERVAL '30 days'
      ORDER BY CREATED_AT DESC
      LIMIT $2
    `;
      const activitiesResult = await dbQuery(activitiesQuery, [
        req.user.userId,
        parseInt(limit),
      ]);

      res.json({
        success: true,
        data: { activities: activitiesResult.rows },
      });
    } catch (error) {
      logger.error("Get activity error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get activity",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
