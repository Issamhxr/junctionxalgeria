const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { auth } = require("../middleware/auth");
const logger = require("../utils/logger");

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("firstName")
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
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

      const prisma = req.app.get("prisma");
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        role = "FARMER",
      } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            existingUser.email === email
              ? "Email already registered"
              : "Username already taken",
        });
      }

      // Store password as plain text (no hashing)
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password, // Store password as-is without hashing
          firstName,
          lastName,
          role,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = generateToken(user.id);

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          resource: "user",
          resourceId: user.id,
          metadata: { email, username },
        },
      });

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
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

      const prisma = req.app.get("prisma");
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Check password (plain text comparison)
      if (password !== user.password) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate token
      const token = generateToken(user.id);

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          resource: "user",
          resourceId: user.id,
          metadata: { email },
        },
      });

      logger.info(`User logged in: ${email}`);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: userWithoutPassword,
          token,
        },
      });
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      include: {
        preferences: true,
        farms: {
          include: {
            farm: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error("Get user info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user info",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    auth,
    body("firstName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
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

      const prisma = req.app.get("prisma");
      const { firstName, lastName, username } = req.body;

      // Check if username is already taken (if provided)
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            NOT: {
              id: req.user.userId,
            },
          },
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Username already taken",
          });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(username && { username }),
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          updatedAt: true,
        },
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user.userId,
          action: "UPDATE_PROFILE",
          resource: "user",
          resourceId: req.user.userId,
          metadata: { firstName, lastName, username },
        },
      });

      logger.info(`User profile updated: ${updatedUser.email}`);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      logger.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put(
  "/password",
  [
    auth,
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
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

      const prisma = req.app.get("prisma");
      const { currentPassword, newPassword } = req.body;

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password (plain text comparison)
      if (currentPassword !== user.password) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password (store as plain text)
      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          password: newPassword, // Store new password as-is without hashing
        },
      });

      // Log activity
      await prisma.userActivity.create({
        data: {
          userId: req.user.userId,
          action: "SETTINGS_CHANGED",
          resource: "user",
          resourceId: req.user.userId,
          metadata: { action: "password_change" },
        },
      });

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      logger.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: req.user.userId,
        action: "LOGOUT",
        resource: "user",
        resourceId: req.user.userId,
        metadata: {},
      },
    });

    logger.info(`User logged out: ${req.user.userId}`);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
