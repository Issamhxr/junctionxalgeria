const express = require("express");
const { body, validationResult, param, query } = require("express-validator");
const { auth, authorize } = require("../middleware/auth");
const { query: dbQuery } = require("../database/connection");
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
    param("pondId").isUUID().withMessage("Pond ID must be a valid UUID"),
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

      // Check if user has access to this pond
      const accessQuery = `
      SELECT p.ID, p.NAME, p.TYPE
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

      // Build date filter
      let dateFilter = "";
      let queryParams = [pondId];
      let paramIndex = 2;

      if (startDate) {
        dateFilter += ` AND CREATED_AT >= $${paramIndex}`;
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        dateFilter += ` AND CREATED_AT <= $${paramIndex}`;
        queryParams.push(endDate);
        paramIndex++;
      }

      // Get sensor data
      const sensorDataQuery = `
      SELECT 
        ID,
        TEMPERATURE,
        PH_LEVEL,
        DISSOLVED_OXYGEN,
        TURBIDITY,
        AMMONIA_LEVEL,
        NITRITE_LEVEL,
        NITRATE_LEVEL,
        SALINITY,
        WATER_LEVEL,
        FLOW_RATE,
        CREATED_AT
      FROM SENSOR_DATA
      WHERE POND_ID = $1 ${dateFilter}
      ORDER BY CREATED_AT DESC
      LIMIT $${paramIndex}
    `;
      queryParams.push(parseInt(limit));

      const sensorDataResult = await dbQuery(sensorDataQuery, queryParams);

      res.json({
        success: true,
        data: {
          sensorData: sensorDataResult.rows,
          pond: {
            id: pond.id,
            name: pond.name,
            type: pond.type,
          },
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
    body("pondId").isUUID().withMessage("Pond ID must be a valid UUID"),
    body("temperature")
      .isFloat({ min: -10, max: 50 })
      .withMessage("Temperature must be between -10 and 50°C"),
    body("ph_level")
      .isFloat({ min: 0, max: 14 })
      .withMessage("pH must be between 0 and 14"),
    body("dissolved_oxygen")
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
    body("ammonia_level")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Ammonia must be a positive number"),
    body("nitrite_level")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Nitrite must be a positive number"),
    body("nitrate_level")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Nitrate must be a positive number"),
    body("water_level")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Water level must be a positive number"),
    body("flow_rate")
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
        ph_level,
        dissolved_oxygen,
        salinity,
        turbidity,
        ammonia_level,
        nitrite_level,
        nitrate_level,
        water_level,
        flow_rate,
      } = req.body;

      // Check if user has access to this pond
      const accessQuery = `
      SELECT p.ID, p.NAME, p.TYPE
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

      // Create sensor reading
      const insertQuery = `
      INSERT INTO SENSOR_DATA (
        POND_ID, TEMPERATURE, PH_LEVEL, DISSOLVED_OXYGEN, TURBIDITY, 
        AMMONIA_LEVEL, NITRITE_LEVEL, NITRATE_LEVEL, SALINITY, WATER_LEVEL, FLOW_RATE
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

      const insertResult = await dbQuery(insertQuery, [
        pondId,
        temperature,
        ph_level,
        dissolved_oxygen,
        turbidity,
        ammonia_level,
        nitrite_level,
        nitrate_level,
        salinity,
        water_level,
        flow_rate,
      ]);

      const sensorReading = insertResult.rows[0];

      // Check for threshold violations and create alerts if needed
      const thresholdQuery = `
      SELECT PARAMETER, MIN_VALUE, MAX_VALUE, OPTIMAL_MIN, OPTIMAL_MAX
      FROM THRESHOLDS
      WHERE POND_ID = $1 AND IS_ACTIVE = true
    `;
      const thresholdResult = await dbQuery(thresholdQuery, [pondId]);

      for (const threshold of thresholdResult.rows) {
        const param = threshold.parameter.toLowerCase();
        const currentValue = req.body[param];

        if (currentValue !== undefined && currentValue !== null) {
          if (
            currentValue < threshold.min_value ||
            currentValue > threshold.max_value
          ) {
            // Create alert
            const alertQuery = `
            INSERT INTO ALERTS (
              FARM_ID, POND_ID, USER_ID, TYPE, SEVERITY, TITLE, MESSAGE, 
              PARAMETER, CURRENT_VALUE, THRESHOLD_VALUE
            ) VALUES (
              (SELECT FARM_ID FROM PONDS WHERE ID = $1), 
              $1, $2, 'THRESHOLD_EXCEEDED', 
              CASE WHEN $3 < $4 OR $3 > $5 THEN 'CRITICAL' ELSE 'HIGH' END,
              $6, $7, $8, $3, 
              CASE WHEN $3 < $4 THEN $4 ELSE $5 END
            )
          `;

            const alertTitle = `${threshold.parameter} Alert`;
            const alertMessage = `${threshold.parameter} value ${currentValue} is outside acceptable range (${threshold.min_value}-${threshold.max_value}) in ${pond.name}`;

            await dbQuery(alertQuery, [
              pondId,
              req.user.userId,
              currentValue,
              threshold.min_value,
              threshold.max_value,
              alertTitle,
              alertMessage,
              param,
            ]);
          }
        }
      }

      // Emit real-time data to connected clients
      const io = req.app.get("io");
      if (io) {
        io.to(`pond_${pondId}`).emit("sensorData", {
          pondId,
          data: sensorReading,
          pond: {
            id: pond.id,
            name: pond.name,
            type: pond.type,
          },
        });
      }

      // Log activity
      const activityQuery = `
      INSERT INTO ACTIVITY_LOGS (USER_ID, ACTION, ENTITY, ENTITY_ID, DETAILS)
      VALUES ($1, $2, $3, $4, $5)
    `;
      await dbQuery(activityQuery, [
        req.user.userId,
        "SENSOR_DATA_ADDED",
        "sensor_data",
        sensorReading.id,
        JSON.stringify({
          pondId,
          temperature,
          ph_level,
          dissolved_oxygen,
          salinity,
        }),
      ]);

      logger.info(
        `Sensor data added for pond ${pondId} by user ${req.user.userId}`
      );

      res.status(201).json({
        success: true,
        message: "Sensor data recorded successfully",
        data: { sensorReading },
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
      const { period = "day" } = req.query;

      // Check if user has access to this pond
      const accessQuery = `
      SELECT p.ID, p.NAME, p.TYPE
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

      // Calculate date range based on period
      const now = new Date();
      let intervalClause;

      switch (period) {
        case "day":
          intervalClause = "INTERVAL '1 day'";
          break;
        case "week":
          intervalClause = "INTERVAL '7 days'";
          break;
        case "month":
          intervalClause = "INTERVAL '30 days'";
          break;
        default:
          intervalClause = "INTERVAL '1 day'";
      }

      // Get sensor data statistics
      const statsQuery = `
      SELECT 
        COUNT(*) as total_readings,
        AVG(TEMPERATURE) as avg_temperature,
        MIN(TEMPERATURE) as min_temperature,
        MAX(TEMPERATURE) as max_temperature,
        AVG(PH_LEVEL) as avg_ph,
        MIN(PH_LEVEL) as min_ph,
        MAX(PH_LEVEL) as max_ph,
        AVG(DISSOLVED_OXYGEN) as avg_oxygen,
        MIN(DISSOLVED_OXYGEN) as min_oxygen,
        MAX(DISSOLVED_OXYGEN) as max_oxygen,
        AVG(SALINITY) as avg_salinity,
        MIN(SALINITY) as min_salinity,
        MAX(SALINITY) as max_salinity,
        (SELECT TEMPERATURE FROM SENSOR_DATA WHERE POND_ID = $1 ORDER BY CREATED_AT DESC LIMIT 1) as current_temperature,
        (SELECT PH_LEVEL FROM SENSOR_DATA WHERE POND_ID = $1 ORDER BY CREATED_AT DESC LIMIT 1) as current_ph,
        (SELECT DISSOLVED_OXYGEN FROM SENSOR_DATA WHERE POND_ID = $1 ORDER BY CREATED_AT DESC LIMIT 1) as current_oxygen,
        (SELECT SALINITY FROM SENSOR_DATA WHERE POND_ID = $1 ORDER BY CREATED_AT DESC LIMIT 1) as current_salinity
      FROM SENSOR_DATA
      WHERE POND_ID = $1 AND CREATED_AT >= NOW() - ${intervalClause}
    `;
      const statsResult = await dbQuery(statsQuery, [pondId]);

      if (parseInt(statsResult.rows[0].total_readings) === 0) {
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

      const rawStats = statsResult.rows[0];

      // Format statistics
      const stats = {
        temperature: {
          min: parseFloat(rawStats.min_temperature) || 0,
          max: parseFloat(rawStats.max_temperature) || 0,
          avg:
            Math.round(parseFloat(rawStats.avg_temperature) * 100) / 100 || 0,
          current: parseFloat(rawStats.current_temperature) || 0,
        },
        ph_level: {
          min: parseFloat(rawStats.min_ph) || 0,
          max: parseFloat(rawStats.max_ph) || 0,
          avg: Math.round(parseFloat(rawStats.avg_ph) * 100) / 100 || 0,
          current: parseFloat(rawStats.current_ph) || 0,
        },
        dissolved_oxygen: {
          min: parseFloat(rawStats.min_oxygen) || 0,
          max: parseFloat(rawStats.max_oxygen) || 0,
          avg: Math.round(parseFloat(rawStats.avg_oxygen) * 100) / 100 || 0,
          current: parseFloat(rawStats.current_oxygen) || 0,
        },
        salinity: {
          min: parseFloat(rawStats.min_salinity) || 0,
          max: parseFloat(rawStats.max_salinity) || 0,
          avg: Math.round(parseFloat(rawStats.avg_salinity) * 100) / 100 || 0,
          current: parseFloat(rawStats.current_salinity) || 0,
        },
      };

      // Calculate trends (comparison between first and last readings in period)
      const trendsQuery = `
      WITH first_last AS (
        SELECT 
          FIRST_VALUE(TEMPERATURE) OVER (ORDER BY CREATED_AT) as first_temp,
          LAST_VALUE(TEMPERATURE) OVER (ORDER BY CREATED_AT ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_temp,
          FIRST_VALUE(PH_LEVEL) OVER (ORDER BY CREATED_AT) as first_ph,
          LAST_VALUE(PH_LEVEL) OVER (ORDER BY CREATED_AT ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_ph,
          FIRST_VALUE(DISSOLVED_OXYGEN) OVER (ORDER BY CREATED_AT) as first_oxygen,
          LAST_VALUE(DISSOLVED_OXYGEN) OVER (ORDER BY CREATED_AT ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_oxygen,
          FIRST_VALUE(SALINITY) OVER (ORDER BY CREATED_AT) as first_salinity,
          LAST_VALUE(SALINITY) OVER (ORDER BY CREATED_AT ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as last_salinity
        FROM SENSOR_DATA
        WHERE POND_ID = $1 AND CREATED_AT >= NOW() - ${intervalClause}
      )
      SELECT DISTINCT * FROM first_last
    `;
      const trendsResult = await dbQuery(trendsQuery, [pondId]);

      let trends = null;
      if (trendsResult.rows.length > 0) {
        const trendData = trendsResult.rows[0];
        trends = {
          temperature:
            Math.round(
              (parseFloat(trendData.last_temp) -
                parseFloat(trendData.first_temp)) *
                100
            ) / 100,
          ph_level:
            Math.round(
              (parseFloat(trendData.last_ph) - parseFloat(trendData.first_ph)) *
                100
            ) / 100,
          dissolved_oxygen:
            Math.round(
              (parseFloat(trendData.last_oxygen) -
                parseFloat(trendData.first_oxygen)) *
                100
            ) / 100,
          salinity:
            Math.round(
              (parseFloat(trendData.last_salinity) -
                parseFloat(trendData.first_salinity)) *
                100
            ) / 100,
        };
      }

      res.json({
        success: true,
        data: {
          period,
          count: parseInt(rawStats.total_readings),
          stats,
          trends,
          dateRange: {
            start: new Date(
              now.getTime() -
                (period === "day"
                  ? 24 * 60 * 60 * 1000
                  : period === "week"
                  ? 7 * 24 * 60 * 60 * 1000
                  : 30 * 24 * 60 * 60 * 1000)
            ),
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
  [param("pondId").isUUID().withMessage("Pond ID must be a valid UUID")],
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

      // Check if user has access to this pond
      const accessQuery = `
      SELECT p.ID, p.NAME, p.TYPE
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

      // Get latest sensor reading
      const latestQuery = `
      SELECT 
        ID,
        TEMPERATURE,
        PH_LEVEL,
        DISSOLVED_OXYGEN,
        TURBIDITY,
        AMMONIA_LEVEL,
        NITRITE_LEVEL,
        NITRATE_LEVEL,
        SALINITY,
        WATER_LEVEL,
        FLOW_RATE,
        CREATED_AT
      FROM SENSOR_DATA
      WHERE POND_ID = $1
      ORDER BY CREATED_AT DESC
      LIMIT 1
    `;
      const latestResult = await dbQuery(latestQuery, [pondId]);

      if (latestResult.rows.length === 0) {
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
          sensorReading: latestResult.rows[0],
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
    param("id").isUUID().withMessage("Sensor data ID must be a valid UUID"),
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

      // Check if sensor reading exists
      const checkQuery = `
      SELECT sd.ID, sd.POND_ID, p.NAME as pond_name
      FROM SENSOR_DATA sd
      JOIN PONDS p ON sd.POND_ID = p.ID
      WHERE sd.ID = $1
    `;
      const checkResult = await dbQuery(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Sensor reading not found",
        });
      }

      const sensorReading = checkResult.rows[0];

      // Delete sensor reading
      const deleteQuery = `DELETE FROM SENSOR_DATA WHERE ID = $1`;
      await dbQuery(deleteQuery, [id]);

      // Log activity
      const activityQuery = `
      INSERT INTO ACTIVITY_LOGS (USER_ID, ACTION, ENTITY, ENTITY_ID, DETAILS)
      VALUES ($1, $2, $3, $4, $5)
    `;
      await dbQuery(activityQuery, [
        req.user.userId,
        "SENSOR_DATA_DELETED",
        "sensor_data",
        id,
        JSON.stringify({
          pondId: sensorReading.pond_id,
          pondName: sensorReading.pond_name,
        }),
      ]);

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
