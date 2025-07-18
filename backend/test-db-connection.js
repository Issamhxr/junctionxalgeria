const { Pool } = require("pg");
require("dotenv").config();

async function testConnection() {
  console.log("Testing database connection...");
  console.log("Connection details:");
  console.log("Host:", process.env.DB_HOST);
  console.log("Port:", process.env.DB_PORT);
  console.log("Database:", process.env.DB_NAME);
  console.log("User:", process.env.DB_USER);
  console.log(
    "SSL enabled:",
    process.env.NODE_ENV === "production" ||
      process.env.DB_HOST?.includes("aivencloud.com")
  );

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:
      process.env.NODE_ENV === "production" ||
      process.env.DB_HOST?.includes("aivencloud.com")
        ? {
            rejectUnauthorized: false,
            require: true,
          }
        : false,
    connectionTimeoutMillis: 30000, // Increased from 10000 to 30000
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
  });

  try {
    const client = await pool.connect();
    console.log("✅ Database connection successful!");

    const result = await client.query(
      "SELECT version(), current_database(), current_user"
    );
    console.log("Database version:", result.rows[0].version);
    console.log("Current database:", result.rows[0].current_database);
    console.log("Current user:", result.rows[0].current_user);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
