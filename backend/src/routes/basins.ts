import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireBaseChief,
  requireOperator,
} from "../middleware/auth";
import { prisma } from "../lib/db";

const router = Router();

// Get all basins
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const basins = await prisma.basin.findMany({
        where: { deleted: false },
        include: {
          base: {
            select: {
              id: true,
              name: true,
              centre: {
                select: {
                  id: true,
                  name: true,
                  region: true,
                },
              },
            },
          },
          readings: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
          alerts: {
            orderBy: { timestamp: "desc" },
            take: 5,
          },
        },
        orderBy: { name: "asc" },
      });

      res.json(basins);
    } catch (error) {
      console.error("Get basins error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get basin by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const basin = await prisma.basin.findUnique({
        where: { id, deleted: false },
        include: {
          base: {
            select: {
              id: true,
              name: true,
              centre: {
                select: {
                  id: true,
                  name: true,
                  region: true,
                },
              },
            },
          },
          readings: {
            orderBy: { timestamp: "desc" },
            take: 50,
          },
          alerts: {
            orderBy: { timestamp: "desc" },
            take: 20,
          },
        },
      });

      if (!basin) {
        return res.status(404).json({ error: "Basin not found" });
      }

      res.json(basin);
    } catch (error) {
      console.error("Get basin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Create new basin
router.post(
  "/",
  [body("name").notEmpty().trim(), body("baseId").notEmpty().isUUID()],
  authenticateToken,
  requireBaseChief,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, baseId } = req.body;

      // Verify base exists
      const base = await prisma.base.findUnique({
        where: { id: baseId, deleted: false },
      });

      if (!base) {
        return res.status(404).json({ error: "Base not found" });
      }

      const basin = await prisma.basin.create({
        data: {
          name,
          baseId,
        },
        include: {
          base: {
            select: {
              id: true,
              name: true,
              centre: {
                select: {
                  id: true,
                  name: true,
                  region: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        message: "Basin created successfully",
        basin,
      });
    } catch (error) {
      console.error("Create basin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update basin
router.put(
  "/:id",
  [
    body("name").optional().notEmpty().trim(),
    body("baseId").optional().isUUID(),
  ],
  authenticateToken,
  requireBaseChief,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, baseId } = req.body;

      const basin = await prisma.basin.update({
        where: { id, deleted: false },
        data: {
          ...(name && { name }),
          ...(baseId && { baseId }),
        },
        include: {
          base: {
            select: {
              id: true,
              name: true,
              centre: {
                select: {
                  id: true,
                  name: true,
                  region: true,
                },
              },
            },
          },
        },
      });

      res.json({
        message: "Basin updated successfully",
        basin,
      });
    } catch (error) {
      console.error("Update basin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete basin (soft delete)
router.delete(
  "/:id",
  authenticateToken,
  requireBaseChief,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.basin.update({
        where: { id },
        data: { deleted: true },
      });

      res.json({ message: "Basin deleted successfully" });
    } catch (error) {
      console.error("Delete basin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Add reading to basin
router.post(
  "/:id/readings",
  [
    body("ph").isFloat({ min: 0, max: 14 }),
    body("temperature").isFloat({ min: -10, max: 50 }),
    body("oxygen").isFloat({ min: 0, max: 20 }),
    body("salinity").isFloat({ min: 0, max: 100 }),
    body("turbidity").optional().isFloat({ min: 0 }),
    body("timestamp").optional().isISO8601(),
  ],
  authenticateToken,
  requireOperator,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { ph, temperature, oxygen, salinity, turbidity, timestamp } =
        req.body;

      // Verify basin exists
      const basin = await prisma.basin.findUnique({
        where: { id, deleted: false },
      });

      if (!basin) {
        return res.status(404).json({ error: "Basin not found" });
      }

      const reading = await prisma.reading.create({
        data: {
          basinId: id,
          ph,
          temperature,
          oxygen,
          salinity,
          turbidity,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });

      // Check for alerts
      const alerts = [];
      if (ph < 6.0 || ph > 8.5) {
        alerts.push({
          basinId: id,
          parameter: "pH",
          value: ph,
          message: `pH level ${ph} is outside normal range (6.0-8.5)`,
        });
      }
      if (temperature < 18 || temperature > 30) {
        alerts.push({
          basinId: id,
          parameter: "Temperature",
          value: temperature,
          message: `Temperature ${temperature}°C is outside normal range (18-30°C)`,
        });
      }
      if (oxygen < 4.0) {
        alerts.push({
          basinId: id,
          parameter: "Oxygen",
          value: oxygen,
          message: `Oxygen level ${oxygen} mg/L is below minimum (4.0 mg/L)`,
        });
      }
      if (salinity > 35) {
        alerts.push({
          basinId: id,
          parameter: "Salinity",
          value: salinity,
          message: `Salinity ${salinity} ppt is above maximum (35 ppt)`,
        });
      }

      // Create alerts if any
      if (alerts.length > 0) {
        await prisma.alert.createMany({
          data: alerts,
        });
      }

      res.status(201).json({
        message: "Reading added successfully",
        reading,
        alertsGenerated: alerts.length,
      });
    } catch (error) {
      console.error("Add reading error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get basin readings
router.get(
  "/:id/readings",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = "100", offset = "0" } = req.query;

      const readings = await prisma.reading.findMany({
        where: { basinId: id },
        orderBy: { timestamp: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      res.json(readings);
    } catch (error) {
      console.error("Get readings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get basin alerts
router.get(
  "/:id/alerts",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = "50", offset = "0" } = req.query;

      const alerts = await prisma.alert.findMany({
        where: { basinId: id },
        orderBy: { timestamp: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      res.json(alerts);
    } catch (error) {
      console.error("Get alerts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
