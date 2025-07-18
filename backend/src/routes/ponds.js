const express = require("express");
const { body, validationResult, param } = require("express-validator");
const { auth, authorize } = require("../middleware/auth");
const { query } = require("../database/connection");
const logger = require("../utils/logger");

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/ponds
// @desc    Get all ponds for the authenticated user
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, farmId, type } = req.query;

    // Build WHERE clause based on user role and filters
    let whereClause = "WHERE p.IS_ACTIVE = true";
    let queryParams = [];
    let paramIndex = 1;

    // For non-admin users, filter by farm access
    if (req.user.role !== "ADMIN") {
      whereClause += ` AND p.FARM_ID IN (
        SELECT fu.FARM_ID FROM FARM_USERS fu WHERE fu.USER_ID = $${paramIndex}
      )`;
      queryParams.push(req.user.userId);
      paramIndex++;
    }

    if (farmId) {
      whereClause += ` AND p.FARM_ID = $${paramIndex}`;
      queryParams.push(farmId);
      paramIndex++;
    }

    if (type) {
      whereClause += ` AND p.TYPE = $${paramIndex}`;
      queryParams.push(type.toUpperCase());
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM PONDS p
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get ponds with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const pondsQuery = `
      SELECT 
        p.ID,
        p.NAME,
        p.DESCRIPTION,
        p.TYPE,
        p.LENGTH,
        p.WIDTH,
        p.DEPTH,
        p.VOLUME,
        p.FISH_SPECIES,
        p.FISH_COUNT,
        p.STOCKING_DENSITY,
        p.FEEDING_SCHEDULE,
        p.CREATED_AT,
        p.UPDATED_AT,
        f.ID as farm_id,
        f.NAME as farm_name,
        f.LOCATION as farm_location,
        (
          SELECT COUNT(*)
          FROM ALERTS a
          WHERE a.POND_ID = p.ID AND a.IS_RESOLVED = false
        ) as unresolved_alerts_count
      FROM PONDS p
      JOIN FARMS f ON p.FARM_ID = f.ID
      ${whereClause}
      ORDER BY p.UPDATED_AT DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);
    const pondsResult = await query(pondsQuery, queryParams);

    // Get latest sensor data for each pond
    const ponds = await Promise.all(
      pondsResult.rows.map(async (pond) => {
        const sensorDataQuery = `
        SELECT 
          TEMPERATURE,
          PH_LEVEL,
          DISSOLVED_OXYGEN,
          TURBIDITY,
          AMMONIA_LEVEL,
          CREATED_AT
        FROM SENSOR_DATA
        WHERE POND_ID = $1
        ORDER BY CREATED_AT DESC
        LIMIT 1
      `;
        const sensorResult = await query(sensorDataQuery, [pond.id]);

        return {
          ...pond,
          latestSensorData: sensorResult.rows[0] || null,
          farm: {
            id: pond.farm_id,
            name: pond.farm_name,
            location: pond.farm_location,
          },
        };
      })
    );

    res.json({
      success: true,
      data: {
        ponds,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Get ponds error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get ponds",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/ponds/:id
// @desc    Get pond details by ID
// @access  Private
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Pond ID must be a valid UUID")],
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

      // Check if user has access to this pond
      let accessQuery = `
        SELECT 
          p.ID,
          p.NAME,
          p.DESCRIPTION,
          p.TYPE,
          p.LENGTH,
          p.WIDTH,
          p.DEPTH,
          p.VOLUME,
          p.FISH_SPECIES,
          p.FISH_COUNT,
          p.STOCKING_DENSITY,
          p.FEEDING_SCHEDULE,
          p.IS_ACTIVE,
          p.CREATED_AT,
          p.UPDATED_AT,
          f.ID as farm_id,
          f.NAME as farm_name,
          f.LOCATION as farm_location,
          f.DESCRIPTION as farm_description
        FROM PONDS p
        JOIN FARMS f ON p.FARM_ID = f.ID
        WHERE p.ID = $1 AND p.IS_ACTIVE = true
      `;

      let queryParams = [id];

      // For non-admin users, check farm access
      if (req.user.role !== "ADMIN") {
        accessQuery += ` AND p.FARM_ID IN (
          SELECT fu.FARM_ID FROM FARM_USERS fu WHERE fu.USER_ID = $2
        )`;
        queryParams.push(req.user.userId);
      }

      const pondResult = await query(accessQuery, queryParams);

      if (pondResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      const pond = pondResult.rows[0];

      // Get recent sensor data (last 24 hours)
      const sensorDataQuery = `
        SELECT 
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
        AND CREATED_AT >= NOW() - INTERVAL '24 hours'
        ORDER BY CREATED_AT DESC
        LIMIT 100
      `;
      const sensorDataResult = await query(sensorDataQuery, [id]);

      // Get recent alerts (last 7 days)
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
        AND CREATED_AT >= NOW() - INTERVAL '7 days'
        ORDER BY CREATED_AT DESC
        LIMIT 10
      `;
      const alertsResult = await query(alertsQuery, [id]);

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
      const thresholdsResult = await query(thresholdsQuery, [id]);

      // Calculate statistics
      const sensorData = sensorDataResult.rows;
      const stats = {
        temperature: { min: null, max: null, avg: null, current: null },
        ph_level: { min: null, max: null, avg: null, current: null },
        dissolved_oxygen: { min: null, max: null, avg: null, current: null },
        turbidity: { min: null, max: null, avg: null, current: null },
        ammonia_level: { min: null, max: null, avg: null, current: null },
      };

      if (sensorData.length > 0) {
        // Current values (most recent)
        const latest = sensorData[0];
        stats.temperature.current = latest.temperature;
        stats.ph_level.current = latest.ph_level;
        stats.dissolved_oxygen.current = latest.dissolved_oxygen;
        stats.turbidity.current = latest.turbidity;
        stats.ammonia_level.current = latest.ammonia_level;

        // Calculate min, max, avg for each parameter
        Object.keys(stats).forEach((param) => {
          const values = sensorData
            .map((d) => d[param])
            .filter((v) => v !== null && v !== undefined);

          if (values.length > 0) {
            stats[param].min = Math.min(...values);
            stats[param].max = Math.max(...values);
            stats[param].avg =
              Math.round(
                (values.reduce((sum, v) => sum + v, 0) / values.length) * 100
              ) / 100;
          }
        });
      }

      res.json({
        success: true,
        data: {
          pond: {
            ...pond,
            farm: {
              id: pond.farm_id,
              name: pond.farm_name,
              location: pond.farm_location,
              description: pond.farm_description,
            },
            stats,
            recentSensorData: sensorData.slice(0, 50),
            recentAlerts: alertsResult.rows,
            thresholds: thresholdsResult.rows,
          },
        },
      });
    } catch (error) {
      logger.error("Get pond details error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get pond details",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/ponds
// @desc    Create a new pond
// @access  Private (Farmers and above)
router.post(
  "/",
  [
    authorize("FARMER", "ADMIN"),
    body("farmId").isUUID().withMessage("Farm ID must be a valid UUID"),
    body("name")
      .isLength({ min: 3, max: 100 })
      .withMessage("Pond name must be between 3 and 100 characters"),
    body("type")
      .isIn(["FRESHWATER", "SALTWATER", "BRACKISH"])
      .withMessage("Type must be FRESHWATER, SALTWATER, or BRACKISH"),
    body("length")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Length must be a positive number"),
    body("width")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Width must be a positive number"),
    body("depth")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Depth must be a positive number"),
    body("volume")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Volume must be a positive number"),
    body("fishSpecies")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Fish species must be less than 255 characters"),
    body("fishCount")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Fish count must be a non-negative integer"),
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
        farmId,
        name,
        type,
        length,
        width,
        depth,
        volume,
        fishSpecies,
        fishCount,
      } = req.body;

      // Check if user has access to the farm
      if (req.user.role !== "ADMIN") {
        const farmAccessQuery = `
          SELECT 1 FROM FARM_USERS 
          WHERE USER_ID = $1 AND FARM_ID = $2 AND ROLE IN ('owner', 'manager')
        `;
        const farmAccessResult = await query(farmAccessQuery, [
          req.user.userId,
          farmId,
        ]);

        if (farmAccessResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to create ponds in this farm",
          });
        }
      }

      // Create pond
      const insertQuery = `
        INSERT INTO PONDS (
          FARM_ID, NAME, TYPE, LENGTH, WIDTH, DEPTH, VOLUME, FISH_SPECIES, FISH_COUNT
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const insertResult = await query(insertQuery, [
        farmId,
        name,
        type,
        length,
        width,
        depth,
        volume,
        fishSpecies,
        fishCount,
      ]);

      const newPond = insertResult.rows[0];

      // Create default thresholds
      await query("SELECT CREATE_DEFAULT_THRESHOLDS($1)", [newPond.id]);

      // Log activity
      const activityQuery = `
        INSERT INTO ACTIVITY_LOGS (USER_ID, ACTION, ENTITY, ENTITY_ID, DETAILS)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await query(activityQuery, [
        req.user.userId,
        "POND_CREATED",
        "pond",
        newPond.id,
        JSON.stringify({ farmId, name, type }),
      ]);

      logger.info(`Pond created: ${name} by user ${req.user.userId}`);

      res.status(201).json({
        success: true,
        message: "Pond created successfully",
        data: { pond: newPond },
      });
    } catch (error) {
      logger.error("Create pond error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create pond",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/ponds/:id
// @desc    Update pond
// @access  Private (Farmers and above)
router.put(
  "/:id",
  [
    authorize("FARMER", "ADMIN"),
    param("id").isString().withMessage("Pond ID must be a string"),
    body("name")
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage("Pond name must be between 3 and 100 characters"),
    body("type")
      .optional()
      .isIn(["freshwater", "saltwater", "brackish"])
      .withMessage("Type must be freshwater, saltwater, or brackish"),
    body("volume")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Volume must be a positive number"),
    body("depth")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Depth must be a positive number"),
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
      const { name, type, volume, depth } = req.body;

      // Check if pond exists and user has access
      const existingPond = await query(
        `
        SELECT 1
        FROM PONDS p
        JOIN FARM_USERS fu ON p.FARM_ID = fu.FARM_ID
        WHERE p.ID = $1 AND p.IS_ACTIVE = true AND fu.USER_ID = $2
      `,
        [id, req.user.userId]
      );

      if (existingPond.rows.length === 0 && req.user.role !== "ADMIN") {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      // Update pond
      const pond = await query(
        `
        UPDATE PONDS
        SET 
          ${name ? "NAME = $1," : ""}
          ${type ? "TYPE = $2," : ""}
          ${volume !== undefined ? "VOLUME = $3," : ""}
          ${depth !== undefined ? "DEPTH = $4," : ""}
          UPDATED_AT = NOW()
        WHERE ID = $5
        RETURNING *
      `,
        [
          ...(name ? [name] : []),
          ...(type ? [type] : []),
          ...(volume !== undefined ? [volume] : []),
          ...(depth !== undefined ? [depth] : []),
          id,
        ]
      );

      // Log activity
      await query(
        `
        INSERT INTO ACTIVITY_LOGS (USER_ID, ACTION, ENTITY, ENTITY_ID, DETAILS)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          req.user.userId,
          "POND_UPDATED",
          "pond",
          pond.rows[0].id,
          JSON.stringify({ name, type, volume, depth }),
        ]
      );

      logger.info(
        `Pond updated: ${pond.rows[0].name} by user ${req.user.userId}`
      );

      res.json({
        success: true,
        message: "Pond updated successfully",
        data: { pond: pond.rows[0] },
      });
    } catch (error) {
      logger.error("Update pond error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update pond",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   DELETE /api/ponds/:id
// @desc    Delete pond (soft delete)
// @access  Private (Farmers and above)
router.delete(
  "/:id",
  [
    authorize("FARMER", "ADMIN"),
    param("id").isString().withMessage("Pond ID must be a string"),
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

      // Check if pond exists and user has access
      const existingPond = await query(
        `
        SELECT 1
        FROM PONDS p
        JOIN FARM_USERS fu ON p.FARM_ID = fu.FARM_ID
        WHERE p.ID = $1 AND p.IS_ACTIVE = true AND fu.USER_ID = $2
      `,
        [id, req.user.userId]
      );

      if (existingPond.rows.length === 0 && req.user.role !== "ADMIN") {
        return res.status(404).json({
          success: false,
          message: "Pond not found or access denied",
        });
      }

      // Soft delete pond
      await query(
        `
        UPDATE PONDS
        SET IS_ACTIVE = false
        WHERE ID = $1
      `,
        [id]
      );

      // Log activity
      await query(
        `
        INSERT INTO ACTIVITY_LOGS (USER_ID, ACTION, ENTITY, ENTITY_ID, DETAILS)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          req.user.userId,
          "POND_DELETED",
          "pond",
          id,
          JSON.stringify({ name: existingPond.rows[0].name }),
        ]
      );

      logger.info(
        `Pond deleted: ${existingPond.rows[0].name} by user ${req.user.userId}`
      );

      res.json({
        success: true,
        message: "Pond deleted successfully",
      });
    } catch (error) {
      logger.error("Delete pond error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete pond",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
