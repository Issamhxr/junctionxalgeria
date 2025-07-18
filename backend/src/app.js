const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const http = require("http");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const errorHandler = require("./middleware/errorHandler");
const { connectDB, closeDB } = require("./database/connection");
const logger = require("./utils/logger");

// Import routes
const authRoutes = require("./routes/auth");
const pondRoutes = require("./routes/ponds");
const sensorRoutes = require("./routes/sensors");
const alertRoutes = require("./routes/alerts");
const dashboardRoutes = require("./routes/dashboard");
const userRoutes = require("./routes/users");

// Import services
const alertService = require("./services/alertService");
const dataSimulator = require("./services/dataSimulator");

const app = express();
const server = http.createServer(app);

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Make io and prisma accessible to routes
app.set("io", io);
app.set("prisma", prisma);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Compression and logging
app.use(compression());
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/ponds", pondRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on("joinPond", (pondId) => {
    socket.join(`pond_${pondId}`);
    logger.info(`Client ${socket.id} joined pond ${pondId}`);
  });

  socket.on("leavePond", (pondId) => {
    socket.leave(`pond_${pondId}`);
    logger.info(`Client ${socket.id} left pond ${pondId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize alert service with prisma client
    await alertService.initialize(io, prisma);

    // Start data simulation if enabled
    if (process.env.ENABLE_DATA_SIMULATION === "true") {
      await dataSimulator.start(io);
      logger.info(
        "Data simulation started - updating sensor data every 5 seconds"
      );
    }
  } catch (error) {
    logger.error("Failed to initialize services:", error);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await connectDB();
    logger.info("Database connected successfully");

    // Initialize services
    await initializeServices();

    // Start server
    server.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  await closeDB();
  server.close(() => {
    logger.info("Process terminated");
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  await closeDB();
  server.close(() => {
    logger.info("Process terminated");
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", async (err, promise) => {
  logger.error("Unhandled Promise Rejection:", err);
  await prisma.$disconnect();
  await closeDB();
  server.close(() => {
    process.exit(1);
  });
});

// Start the server
startServer();

module.exports = app;
