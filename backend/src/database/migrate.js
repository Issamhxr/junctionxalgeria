const { query } = require('./connection');
const logger = require('../utils/logger');

const createTables = async () => {
  try {
    logger.info('Starting database migration...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'farmer',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Farms table
    await query(`
      CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        area_hectares DECIMAL(10, 2),
        description TEXT,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ponds table
    await query(`
      CREATE TABLE IF NOT EXISTS ponds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
        area_m2 DECIMAL(10, 2),
        depth_m DECIMAL(5, 2),
        volume_m3 DECIMAL(10, 2),
        fish_species VARCHAR(100),
        fish_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sensor data table
    await query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        pond_id INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
        temperature DECIMAL(5, 2),
        ph_level DECIMAL(4, 2),
        dissolved_oxygen DECIMAL(5, 2),
        ammonia_level DECIMAL(5, 3),
        nitrite_level DECIMAL(5, 3),
        nitrate_level DECIMAL(5, 3),
        turbidity DECIMAL(5, 2),
        water_level DECIMAL(5, 2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alerts table
    await query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        pond_id INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        parameter VARCHAR(50),
        current_value DECIMAL(10, 3),
        threshold_value DECIMAL(10, 3),
        is_acknowledged BOOLEAN DEFAULT false,
        acknowledged_by INTEGER REFERENCES users(id),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Alert thresholds table
    await query(`
      CREATE TABLE IF NOT EXISTS alert_thresholds (
        id SERIAL PRIMARY KEY,
        pond_id INTEGER REFERENCES ponds(id) ON DELETE CASCADE,
        parameter VARCHAR(50) NOT NULL,
        min_value DECIMAL(10, 3),
        max_value DECIMAL(10, 3),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pond_id, parameter)
      )
    `);

    // User preferences table
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email_alerts BOOLEAN DEFAULT true,
        sms_alerts BOOLEAN DEFAULT false,
        alert_frequency VARCHAR(20) DEFAULT 'immediate',
        language VARCHAR(10) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Farm users (for sharing farm access)
    await query(`
      CREATE TABLE IF NOT EXISTS farm_users (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'viewer',
        invited_by INTEGER REFERENCES users(id),
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(farm_id, user_id)
      )
    `);

    // System logs table
    await query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_sensor_data_pond_timestamp ON sensor_data(pond_id, timestamp DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_alerts_pond_created ON alerts(pond_id, created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged ON alerts(is_acknowledged, created_at) WHERE is_acknowledged = false`);
    await query(`CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ponds_farm ON ponds(farm_id)`);

    // Create updated_at trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    const tablesWithUpdatedAt = ['users', 'farms', 'ponds', 'alert_thresholds', 'user_preferences'];
    for (const table of tablesWithUpdatedAt) {
      await query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    logger.info('Database migration completed successfully');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  require('dotenv').config();
  const { connectDB } = require('./connection');
  
  const runMigration = async () => {
    try {
      await connectDB();
      await createTables();
      process.exit(0);
    } catch (error) {
      logger.error('Migration failed:', error);
      process.exit(1);
    }
  };

  runMigration();
}

module.exports = { createTables };
