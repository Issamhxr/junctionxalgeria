import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireAdmin,
  requireCentreChief,
} from "../middleware/auth";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth";
import { Role } from "@prisma/client";

const router = Router();

// Get all users (Admin only)
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        where: { deleted: false },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          centreId: true,
          baseId: true,
          createdAt: true,
          updatedAt: true,
          centre: {
            select: { id: true, name: true, region: true },
          },
          base: {
            select: { id: true, name: true, centreId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get user by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id, deleted: false },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          centreId: true,
          baseId: true,
          createdAt: true,
          updatedAt: true,
          centre: {
            select: { id: true, name: true, region: true },
          },
          base: {
            select: { id: true, name: true, centreId: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check permissions
      if (req.user?.role !== Role.ADMIN && req.user?.userId !== user.id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Create new user (Admin or Centre Chief)
router.post(
  "/",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").notEmpty().trim(),
    body("role").isIn(Object.values(Role)),
  ],
  authenticateToken,
  requireCentreChief,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, role, centreId, baseId } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          centreId: role === Role.CENTRE_CHIEF ? centreId : null,
          baseId:
            role === Role.BASE_CHIEF || role === Role.OPERATOR ? baseId : null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          centreId: true,
          baseId: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        message: "User created successfully",
        user,
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update user
router.put(
  "/:id",
  [
    body("email").optional().isEmail().normalizeEmail(),
    body("name").optional().notEmpty().trim(),
    body("role").optional().isIn(Object.values(Role)),
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
      const { email, name, role, centreId, baseId } = req.body;

      const user = await prisma.user.update({
        where: { id, deleted: false },
        data: {
          ...(email && { email }),
          ...(name && { name }),
          ...(role && { role }),
          ...(role === Role.CENTRE_CHIEF && { centreId }),
          ...((role === Role.BASE_CHIEF || role === Role.OPERATOR) && {
            baseId,
          }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          centreId: true,
          baseId: true,
          updatedAt: true,
        },
      });

      res.json({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete user (soft delete)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.user.update({
        where: { id },
        data: { deleted: true },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
