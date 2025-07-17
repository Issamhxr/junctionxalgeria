import { Router, Response } from "express";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import { prisma } from "../lib/db";

const router = Router();

// Get all readings with pagination
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        limit = "100",
        offset = "0",
        basinId,
        startDate,
        endDate,
      } = req.query;

      const whereClause: any = {};
      if (basinId) whereClause.basinId = basinId as string;
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate)
          whereClause.timestamp.gte = new Date(startDate as string);
        if (endDate) whereClause.timestamp.lte = new Date(endDate as string);
      }

      const readings = await prisma.reading.findMany({
        where: whereClause,
        include: {
          basin: {
            select: {
              id: true,
              name: true,
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
          },
        },
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

// Get reading by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const reading = await prisma.reading.findUnique({
        where: { id },
        include: {
          basin: {
            select: {
              id: true,
              name: true,
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
          },
        },
      });

      if (!reading) {
        return res.status(404).json({ error: "Reading not found" });
      }

      res.json(reading);
    } catch (error) {
      console.error("Get reading error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get statistics for readings
router.get(
  "/stats/summary",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { basinId, startDate, endDate } = req.query;

      const whereClause: any = {};
      if (basinId) whereClause.basinId = basinId as string;
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate)
          whereClause.timestamp.gte = new Date(startDate as string);
        if (endDate) whereClause.timestamp.lte = new Date(endDate as string);
      }

      const readings = await prisma.reading.findMany({
        where: whereClause,
        select: {
          ph: true,
          temperature: true,
          oxygen: true,
          salinity: true,
          turbidity: true,
          timestamp: true,
        },
      });

      if (readings.length === 0) {
        return res.json({
          message: "No readings found for the specified criteria",
        });
      }

      // Calculate statistics
      const stats = {
        count: readings.length,
        ph: {
          min: Math.min(...readings.map((r) => r.ph)),
          max: Math.max(...readings.map((r) => r.ph)),
          avg: readings.reduce((sum, r) => sum + r.ph, 0) / readings.length,
        },
        temperature: {
          min: Math.min(...readings.map((r) => r.temperature)),
          max: Math.max(...readings.map((r) => r.temperature)),
          avg:
            readings.reduce((sum, r) => sum + r.temperature, 0) /
            readings.length,
        },
        oxygen: {
          min: Math.min(...readings.map((r) => r.oxygen)),
          max: Math.max(...readings.map((r) => r.oxygen)),
          avg: readings.reduce((sum, r) => sum + r.oxygen, 0) / readings.length,
        },
        salinity: {
          min: Math.min(...readings.map((r) => r.salinity)),
          max: Math.max(...readings.map((r) => r.salinity)),
          avg:
            readings.reduce((sum, r) => sum + r.salinity, 0) / readings.length,
        },
        turbidity: {
          min: Math.min(
            ...readings
              .filter((r) => r.turbidity !== null)
              .map((r) => r.turbidity!)
          ),
          max: Math.max(
            ...readings
              .filter((r) => r.turbidity !== null)
              .map((r) => r.turbidity!)
          ),
          avg:
            readings
              .filter((r) => r.turbidity !== null)
              .reduce((sum, r) => sum + r.turbidity!, 0) /
            readings.filter((r) => r.turbidity !== null).length,
        },
      };

      res.json(stats);
    } catch (error) {
      console.error("Get readings stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
