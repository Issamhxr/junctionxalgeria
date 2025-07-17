import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireAdmin,
  requireCentreChief,
} from "../middleware/auth";
import { prisma } from "../lib/db";

const router = Router();

// Get all centres
router.get(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const centres = await prisma.centre.findMany({
        include: {
          bases: {
            select: {
              id: true,
              name: true,
              deleted: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      res.json(centres);
    } catch (error) {
      console.error("Get centres error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get centre by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const centre = await prisma.centre.findUnique({
        where: { id },
        include: {
          bases: {
            where: { deleted: false },
            include: {
              basins: {
                where: { deleted: false },
                select: {
                  id: true,
                  name: true,
                  createdAt: true,
                },
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

      if (!centre) {
        return res.status(404).json({ error: "Centre not found" });
      }

      res.json(centre);
    } catch (error) {
      console.error("Get centre error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Create new centre
router.post(
  "/",
  [body("name").notEmpty().trim(), body("region").notEmpty().trim()],
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, region } = req.body;

      const centre = await prisma.centre.create({
        data: {
          name,
          region,
        },
        include: {
          bases: true,
          users: true,
        },
      });

      res.status(201).json({
        message: "Centre created successfully",
        centre,
      });
    } catch (error) {
      console.error("Create centre error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update centre
router.put(
  "/:id",
  [
    body("name").optional().notEmpty().trim(),
    body("region").optional().notEmpty().trim(),
  ],
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, region } = req.body;

      const centre = await prisma.centre.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(region && { region }),
        },
        include: {
          bases: true,
          users: true,
        },
      });

      res.json({
        message: "Centre updated successfully",
        centre,
      });
    } catch (error) {
      console.error("Update centre error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete centre
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if centre has bases
      const centre = await prisma.centre.findUnique({
        where: { id },
        include: { bases: true },
      });

      if (!centre) {
        return res.status(404).json({ error: "Centre not found" });
      }

      if (centre.bases.length > 0) {
        return res
          .status(400)
          .json({ error: "Cannot delete centre with existing bases" });
      }

      await prisma.centre.delete({
        where: { id },
      });

      res.json({ message: "Centre deleted successfully" });
    } catch (error) {
      console.error("Delete centre error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
