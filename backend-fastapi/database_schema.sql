-- Aquaculture Management System Database Schema
-- This SQL file contains all the database schema for the aquaculture management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'FARMER', 'TECHNICIAN', 'VIEWER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE pond_type AS ENUM ('FRESHWATER', 'SALTWATER', 'BRACKISH');
CREATE TYPE alert_type AS ENUM (
    'TEMPERATURE_HIGH', 'TEMPERATURE_LOW', 'PH_HIGH', 'PH_LOW',
    'OXYGEN_LOW', 'OXYGEN_HIGH', 'TURBIDITY_HIGH', 'SYSTEM_ERROR',
    'SENSOR_OFFLINE', 'MAINTENANCE_DUE', 'FEEDING_REMINDER', 'WATER_CHANGE'
);
CREATE TYPE alert_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE farm_user_role AS ENUM ('owner', 'manager', 'worker', 'viewer');
CREATE TYPE sensor_type AS ENUM (
    'TEMPERATURE', 'PH', 'OXYGEN', 'TURBIDITY', 'DEPTH', 'FLOW_RATE',
    'CONDUCTIVITY', 'SALINITY', 'NITRATE', 'PHOSPHATE', 'AMMONIA'
);
CREATE TYPE pond_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'VIEWER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    language VARCHAR(5) DEFAULT 'en',
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    alert_frequency INTEGER DEFAULT 30, -- minutes
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    dashboard_layout TEXT, -- JSON string
    notification_types TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farms table
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(500),
    latitude REAL,
    longitude REAL,
    area REAL, -- in hectares
    established_date TIMESTAMP,
    license_number VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on farms
CREATE INDEX idx_farms_name ON farms(name);
CREATE INDEX idx_farms_location ON farms(location);

-- Farm users junction table (many-to-many relationship)
CREATE TABLE farm_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role farm_user_role NOT NULL DEFAULT 'viewer',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    UNIQUE(farm_id, user_id)
);

-- Create indexes on farm_users
CREATE INDEX idx_farm_users_farm_id ON farm_users(farm_id);
CREATE INDEX idx_farm_users_user_id ON farm_users(user_id);

-- Ponds table
CREATE TABLE ponds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type pond_type NOT NULL DEFAULT 'FRESHWATER',
    length REAL, -- in meters
    width REAL, -- in meters
    depth REAL, -- in meters
    volume REAL, -- in liters
    fish_species VARCHAR(255),
    fish_count INTEGER DEFAULT 0,
    stocking_density REAL, -- fish per cubic meter
    feeding_schedule TEXT,
    status pond_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on ponds
CREATE INDEX idx_ponds_farm_id ON ponds(farm_id);
CREATE INDEX idx_ponds_user_id ON ponds(user_id);
CREATE INDEX idx_ponds_type ON ponds(type);
CREATE INDEX idx_ponds_status ON ponds(status);

-- Sensor data table
CREATE TABLE sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    sensor_type sensor_type,
    temperature REAL, -- Celsius
    ph_level REAL, -- pH scale
    dissolved_oxygen REAL, -- mg/L
    turbidity REAL, -- NTU
    ammonia_level REAL, -- mg/L
    nitrite_level REAL, -- mg/L
    nitrate_level REAL, -- mg/L
    salinity REAL, -- ppt
    water_level REAL, -- meters
    flow_rate REAL, -- L/min
    value REAL,
    unit VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality VARCHAR(20), -- GOOD, WARNING, CRITICAL
    device_id VARCHAR(50),
    location VARCHAR(255), -- GPS coordinates or zone identifier
    meta_data TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on sensor_data
CREATE INDEX idx_sensor_data_pond_id ON sensor_data(pond_id);
CREATE INDEX idx_sensor_data_user_id ON sensor_data(user_id);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX idx_sensor_data_sensor_type ON sensor_data(sensor_type);
CREATE INDEX idx_sensor_data_quality ON sensor_data(quality);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    pond_id UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type alert_type NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'LOW',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    parameter VARCHAR(50), -- which parameter triggered the alert
    current_value REAL, -- current value of the parameter
    threshold_value REAL, -- threshold value that was exceeded
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    meta_data TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on alerts
CREATE INDEX idx_alerts_farm_id ON alerts(farm_id);
CREATE INDEX idx_alerts_pond_id ON alerts(pond_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- Thresholds table
CREATE TABLE thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pond_id UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    parameter VARCHAR(50) NOT NULL, -- temperature, ph_level, etc.
    min_value REAL,
    max_value REAL,
    optimal_min REAL,
    optimal_max REAL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on thresholds
CREATE INDEX idx_thresholds_pond_id ON thresholds(pond_id);
CREATE INDEX idx_thresholds_parameter ON thresholds(parameter);
CREATE INDEX idx_thresholds_is_active ON thresholds(is_active);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- User activities table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(50), -- pond, farm, sensor, etc.
    resource_id UUID,
    meta_data TEXT, -- JSON string
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on user_activities
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_action ON user_activities(action);
CREATE INDEX idx_user_activities_resource ON user_activities(resource);
CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ponds_updated_at BEFORE UPDATE ON ponds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thresholds_updated_at BEFORE UPDATE ON thresholds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@example.com', '$2b$12$sample_hash', 'Admin', 'User', 'ADMIN'),
('farmer@example.com', '$2b$12$sample_hash', 'John', 'Farmer', 'FARMER'),
('tech@example.com', '$2b$12$sample_hash', 'Jane', 'Technician', 'TECHNICIAN');

-- Insert sample farm
INSERT INTO farms (name, description, location, latitude, longitude, area, contact_email, contact_phone) VALUES
('Aqua Farm 1', 'Main aquaculture facility', 'Algiers, Algeria', 36.7538, 3.0588, 10.5, 'contact@aquafarm1.com', '+213123456789');

-- Insert sample pond
INSERT INTO ponds (farm_id, user_id, name, description, type, length, width, depth, volume, fish_species, fish_count) VALUES
((SELECT id FROM farms LIMIT 1), (SELECT id FROM users WHERE role = 'FARMER' LIMIT 1), 
 'Pond 1', 'Primary breeding pond', 'FRESHWATER', 50.0, 30.0, 3.0, 4500000, 'Tilapia', 1000);

-- Insert sample thresholds
INSERT INTO thresholds (pond_id, parameter, min_value, max_value, optimal_min, optimal_max) VALUES
((SELECT id FROM ponds LIMIT 1), 'temperature', 18.0, 32.0, 24.0, 28.0),
((SELECT id FROM ponds LIMIT 1), 'ph_level', 6.5, 8.5, 7.0, 8.0),
((SELECT id FROM ponds LIMIT 1), 'dissolved_oxygen', 4.0, 15.0, 6.0, 8.0);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts for the aquaculture management system';
COMMENT ON TABLE farms IS 'Aquaculture farms managed by the system';
COMMENT ON TABLE ponds IS 'Individual ponds within farms';
COMMENT ON TABLE sensor_data IS 'Sensor readings from IoT devices monitoring pond conditions';
COMMENT ON TABLE alerts IS 'System alerts triggered by threshold violations or other events';
COMMENT ON TABLE thresholds IS 'Threshold values for monitoring pond parameters';
COMMENT ON TABLE user_sessions IS 'Active user sessions for authentication';
COMMENT ON TABLE user_activities IS 'Log of user actions for audit purposes';
COMMENT ON TABLE user_preferences IS 'User-specific preferences and settings';
COMMENT ON TABLE farm_users IS 'Many-to-many relationship between users and farms';
