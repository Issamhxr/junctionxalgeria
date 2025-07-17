import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { hashPassword, comparePassword, generateToken } from "../lib/auth";
import { prisma } from "../lib/db";
import { Role } from "@prisma/client";

const router = Router();

// Register a new user
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").notEmpty().trim(),
    body("role").isIn(Object.values(Role)),
  ],
  async (req: Request, res: Response) => {
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

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        centreId: user.centreId || undefined,
        baseId: user.baseId || undefined,
      });

      res.status(201).json({
        message: "User created successfully",
        user,
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Login user
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email, deleted: false },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        centreId: user.centreId || undefined,
        baseId: user.baseId || undefined,
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          centreId: user.centreId,
          baseId: user.baseId,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
