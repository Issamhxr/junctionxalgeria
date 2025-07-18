const { Pool } = require("pg");
const logger = require("../utils/logger");

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "aquaculture_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 5000 to 30000
  ssl:
    process.env.NODE_ENV === "production" ||
    process.env.DB_HOST?.includes("aivencloud.com")
      ? {
          rejectUnauthorized: false,
          require: true,
        }
      : false,
  // Additional connection options for better reliability
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  createRetryIntervalMillis: 200,
  propagateCreateError: false,
});

// Test database connection
const connectDB = async () => {
  try {
    // Debug connection parameters
    logger.info("Attempting database connection with:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      ssl:
        process.env.NODE_ENV === "production" ||
        process.env.DB_HOST?.includes("aivencloud.com"),
    });

    const client = await pool.connect();
    logger.info("Database connected successfully");

    // Test query
    const result = await client.query("SELECT NOW()");
    logger.info(`Database time: ${result.rows[0].now}`);

    client.release();
    return true;
  } catch (error) {
    logger.error("Database connection failed:", error.message);
    logger.error("Full error details:", error);
    throw error;
  }
};

// Query function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms: ${text}`);
    return result;
  } catch (error) {
    logger.error("Database query error:", {
      query: text,
      params: params,
      error: error.message,
    });
    throw error;
  }
};

// Transaction function
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
const closeDB = async () => {
  try {
    await pool.end();
    logger.info("Database connection pool closed");
  } catch (error) {
    logger.error("Error closing database connection:", error);
  }
};

module.exports = {
  pool,
  query,
  transaction,
  connectDB,
  closeDB,
};
