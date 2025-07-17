import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireAdmin,
  requireCentreChief,
  requireBaseChief,
} from "../middleware/auth";
import { prisma } from "../lib/db";

const router = Router();

// Get all bases
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bases = await prisma.base.findMany({
        where: { deleted: false },
        include: {
          centre: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
          basins: {
            where: { deleted: false },
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
          users: {
            where: { deleted: false },
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      res.json(bases);
    } catch (error) {
      console.error("Get bases error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get base by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const base = await prisma.base.findUnique({
        where: { id, deleted: false },
        include: {
          centre: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
          basins: {
            where: { deleted: false },
            include: {
              readings: {
                orderBy: { timestamp: "desc" },
                take: 1,
              },
              alerts: {
                orderBy: { timestamp: "desc" },
                take: 5,
              },
            },
          },
          users: {
            where: { deleted: false },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!base) {
        return res.status(404).json({ error: "Base not found" });
      }

      res.json(base);
    } catch (error) {
      console.error("Get base error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Create new base
router.post(
  "/",
  [body("name").notEmpty().trim(), body("centreId").notEmpty().isUUID()],
  authenticateToken,
  requireCentreChief,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, centreId } = req.body;

      // Verify centre exists
      const centre = await prisma.centre.findUnique({
        where: { id: centreId },
      });

      if (!centre) {
        return res.status(404).json({ error: "Centre not found" });
      }

      const base = await prisma.base.create({
        data: {
          name,
          centreId,
        },
        include: {
          centre: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Base created successfully",
        base,
      });
    } catch (error) {
      console.error("Create base error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update base
router.put(
  "/:id",
  [
    body("name").optional().notEmpty().trim(),
    body("centreId").optional().isUUID(),
  ],
  authenticateToken,
  requireCentreChief,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, centreId } = req.body;

      const base = await prisma.base.update({
        where: { id, deleted: false },
        data: {
          ...(name && { name }),
          ...(centreId && { centreId }),
        },
        include: {
          centre: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        },
      });

      res.json({
        message: "Base updated successfully",
        base,
      });
    } catch (error) {
      console.error("Update base error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete base (soft delete)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.base.update({
        where: { id },
        data: { deleted: true },
      });

      res.json({ message: "Base deleted successfully" });
    } catch (error) {
      console.error("Delete base error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
