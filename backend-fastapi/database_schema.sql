-- Aquaculture Management System Database Schema
-- This SQL file contains all the database schema for the aquaculture management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE USER_ROLE AS
    ENUM ('ADMIN', 'FARMER', 'TECHNICIAN', 'VIEWER');
    CREATE TYPE USER_STATUS AS
        ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
        CREATE TYPE POND_TYPE AS
            ENUM ('FRESHWATER', 'SALTWATER', 'BRACKISH');
            CREATE TYPE ALERT_TYPE AS
                ENUM ( 'TEMPERATURE_HIGH', 'TEMPERATURE_LOW', 'PH_HIGH', 'PH_LOW', 'OXYGEN_LOW', 'OXYGEN_HIGH', 'TURBIDITY_HIGH', 'SYSTEM_ERROR', 'SENSOR_OFFLINE', 'MAINTENANCE_DUE', 'FEEDING_REMINDER', 'WATER_CHANGE' );
                CREATE TYPE ALERT_SEVERITY AS
                    ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
                    CREATE TYPE FARM_USER_ROLE AS
                        ENUM ('owner', 'manager', 'worker', 'viewer');
                        CREATE TYPE SENSOR_TYPE AS
                            ENUM ( 'TEMPERATURE', 'PH', 'OXYGEN', 'TURBIDITY', 'DEPTH', 'FLOW_RATE', 'CONDUCTIVITY', 'SALINITY', 'NITRATE', 'PHOSPHATE', 'AMMONIA' );
                            CREATE TYPE POND_STATUS AS
                                ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED');
 
                                -- Users table
                                CREATE TABLE USERS ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), EMAIL VARCHAR(255) UNIQUE NOT NULL, PASSWORD_HASH VARCHAR(255) NOT NULL, FIRST_NAME VARCHAR(100) NOT NULL, LAST_NAME VARCHAR(100) NOT NULL, PHONE VARCHAR(20), ROLE USER_ROLE NOT NULL DEFAULT 'VIEWER', STATUS USER_STATUS NOT NULL DEFAULT 'ACTIVE', LANGUAGE VARCHAR(5) DEFAULT 'en', LAST_LOGIN TIMESTAMP, EMAIL_VERIFIED BOOLEAN DEFAULT FALSE, PHONE_VERIFIED BOOLEAN DEFAULT FALSE, CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create index on email for faster lookups
                                CREATE INDEX IDX_USERS_EMAIL ON USERS(EMAIL);
                                CREATE INDEX IDX_USERS_ROLE ON USERS(ROLE);
                                CREATE INDEX IDX_USERS_STATUS ON USERS(STATUS);
 
                                -- User preferences table
                                CREATE TABLE USER_PREFERENCES ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), USER_ID UUID UNIQUE REFERENCES USERS(ID) ON DELETE CASCADE, EMAIL_NOTIFICATIONS BOOLEAN DEFAULT TRUE, SMS_NOTIFICATIONS BOOLEAN DEFAULT FALSE, PUSH_NOTIFICATIONS BOOLEAN DEFAULT TRUE, ALERT_FREQUENCY INTEGER DEFAULT 30, -- minutes
                                LANGUAGE VARCHAR(5) DEFAULT 'en', TIMEZONE VARCHAR(50) DEFAULT 'UTC', DASHBOARD_LAYOUT TEXT, -- JSON string
                                NOTIFICATION_TYPES TEXT, -- JSON string
                                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Farms table
                                CREATE TABLE FARMS ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), NAME VARCHAR(255) NOT NULL, DESCRIPTION TEXT, LOCATION VARCHAR(500), LATITUDE REAL, LONGITUDE REAL, AREA REAL, -- in hectares
                                ESTABLISHED_DATE TIMESTAMP, LICENSE_NUMBER VARCHAR(100), CONTACT_EMAIL VARCHAR(255), CONTACT_PHONE VARCHAR(20), CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create indexes on farms
                                CREATE INDEX IDX_FARMS_NAME ON FARMS(NAME);
                                CREATE INDEX IDX_FARMS_LOCATION ON FARMS(LOCATION);
 
                                -- Farm users junction table (many-to-many relationship)
                                CREATE TABLE FARM_USERS ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), FARM_ID UUID NOT NULL REFERENCES FARMS(ID) ON DELETE CASCADE, USER_ID UUID NOT NULL REFERENCES USERS(ID) ON DELETE CASCADE, ROLE FARM_USER_ROLE NOT NULL DEFAULT 'viewer', ASSIGNED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ASSIGNED_BY UUID REFERENCES USERS(ID), UNIQUE(FARM_ID, USER_ID) );
 
                                -- Create indexes on farm_users
                                CREATE INDEX IDX_FARM_USERS_FARM_ID ON FARM_USERS(FARM_ID);
                                CREATE INDEX IDX_FARM_USERS_USER_ID ON FARM_USERS(USER_ID);
 
                                -- Ponds table
                                CREATE TABLE PONDS ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), FARM_ID UUID NOT NULL REFERENCES FARMS(ID) ON DELETE CASCADE, USER_ID UUID NOT NULL REFERENCES USERS(ID), NAME VARCHAR(255) NOT NULL, DESCRIPTION TEXT, TYPE POND_TYPE NOT NULL DEFAULT 'FRESHWATER', LENGTH REAL, -- in meters
                                WIDTH REAL, -- in meters
                                DEPTH REAL, -- in meters
                                VOLUME REAL, -- in liters
                                FISH_SPECIES VARCHAR(255), FISH_COUNT INTEGER DEFAULT 0, STOCKING_DENSITY REAL, -- fish per cubic meter
                                FEEDING_SCHEDULE TEXT, STATUS POND_STATUS DEFAULT 'ACTIVE', CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create indexes on ponds
                                CREATE INDEX IDX_PONDS_FARM_ID ON PONDS(FARM_ID);
                                CREATE INDEX IDX_PONDS_USER_ID ON PONDS(USER_ID);
                                CREATE INDEX IDX_PONDS_TYPE ON PONDS(TYPE);
                                CREATE INDEX IDX_PONDS_STATUS ON PONDS(STATUS);
 
                                -- Sensor data table
                                CREATE TABLE SENSOR_DATA ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), POND_ID UUID NOT NULL REFERENCES PONDS(ID) ON DELETE CASCADE, USER_ID UUID NOT NULL REFERENCES USERS(ID), SENSOR_TYPE SENSOR_TYPE, TEMPERATURE REAL, -- Celsius
                                PH_LEVEL REAL, -- pH scale
                                DISSOLVED_OXYGEN REAL, -- mg/L
                                TURBIDITY REAL, -- NTU
                                AMMONIA_LEVEL REAL, -- mg/L
                                NITRITE_LEVEL REAL, -- mg/L
                                NITRATE_LEVEL REAL, -- mg/L
                                SALINITY REAL, -- ppt
                                WATER_LEVEL REAL, -- meters
                                FLOW_RATE REAL, -- L/min
                                VALUE REAL, UNIT VARCHAR(20), TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP, QUALITY VARCHAR(20), -- GOOD, WARNING, CRITICAL
                                DEVICE_ID VARCHAR(50), LOCATION VARCHAR(255), -- GPS coordinates or zone identifier
                                META_DATA TEXT, -- JSON string
                                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create indexes on sensor_data
                                CREATE INDEX IDX_SENSOR_DATA_POND_ID ON SENSOR_DATA(POND_ID);
                                CREATE INDEX IDX_SENSOR_DATA_USER_ID ON SENSOR_DATA(USER_ID);
                                CREATE INDEX IDX_SENSOR_DATA_TIMESTAMP ON SENSOR_DATA(TIMESTAMP);
                                CREATE INDEX IDX_SENSOR_DATA_SENSOR_TYPE ON SENSOR_DATA(SENSOR_TYPE);
                                CREATE INDEX IDX_SENSOR_DATA_QUALITY ON SENSOR_DATA(QUALITY);
 
                                -- Alerts table
                                CREATE TABLE ALERTS ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), FARM_ID UUID NOT NULL REFERENCES FARMS(ID) ON DELETE CASCADE, POND_ID UUID NOT NULL REFERENCES PONDS(ID) ON DELETE CASCADE, USER_ID UUID REFERENCES USERS(ID), TYPE ALERT_TYPE NOT NULL, SEVERITY ALERT_SEVERITY NOT NULL DEFAULT 'LOW', TITLE VARCHAR(255) NOT NULL, MESSAGE TEXT NOT NULL, PARAMETER VARCHAR(50), -- which parameter triggered the alert
                                CURRENT_VALUE REAL, -- current value of the parameter
                                THRESHOLD_VALUE REAL, -- threshold value that was exceeded
                                IS_READ BOOLEAN DEFAULT FALSE, IS_RESOLVED BOOLEAN DEFAULT FALSE, RESOLVED_AT TIMESTAMP, RESOLVED_BY UUID REFERENCES USERS(ID), META_DATA TEXT, -- JSON string
                                CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create indexes on alerts
                                CREATE INDEX IDX_ALERTS_FARM_ID ON ALERTS(FARM_ID);
                                CREATE INDEX IDX_ALERTS_POND_ID ON ALERTS(POND_ID);
                                CREATE INDEX IDX_ALERTS_USER_ID ON ALERTS(USER_ID);
                                CREATE INDEX IDX_ALERTS_TYPE ON ALERTS(TYPE);
                                CREATE INDEX IDX_ALERTS_SEVERITY ON ALERTS(SEVERITY);
                                CREATE INDEX IDX_ALERTS_IS_READ ON ALERTS(IS_READ);
                                CREATE INDEX IDX_ALERTS_IS_RESOLVED ON ALERTS(IS_RESOLVED);
                                CREATE INDEX IDX_ALERTS_CREATED_AT ON ALERTS(CREATED_AT);
 
                                -- Thresholds table
                                CREATE TABLE THRESHOLDS ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), POND_ID UUID NOT NULL REFERENCES PONDS(ID) ON DELETE CASCADE, PARAMETER VARCHAR(50) NOT NULL, -- temperature, ph_level, etc.
                                MIN_VALUE REAL, MAX_VALUE REAL, OPTIMAL_MIN REAL, OPTIMAL_MAX REAL, IS_ACTIVE BOOLEAN DEFAULT TRUE, CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create indexes on thresholds
                                CREATE INDEX IDX_THRESHOLDS_POND_ID ON THRESHOLDS(POND_ID);
                                CREATE INDEX IDX_THRESHOLDS_PARAMETER ON THRESHOLDS(PARAMETER);
                                CREATE INDEX IDX_THRESHOLDS_IS_ACTIVE ON THRESHOLDS(IS_ACTIVE);
 
                                -- User sessions table
                                CREATE TABLE USER_SESSIONS ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), USER_ID UUID NOT NULL REFERENCES USERS(ID) ON DELETE CASCADE, TOKEN VARCHAR(255) UNIQUE NOT NULL, IP_ADDRESS VARCHAR(45), USER_AGENT TEXT, EXPIRES_AT TIMESTAMP NOT NULL, CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create indexes on user_sessions
                                CREATE INDEX IDX_USER_SESSIONS_USER_ID ON USER_SESSIONS(USER_ID);
                                CREATE INDEX IDX_USER_SESSIONS_TOKEN ON USER_SESSIONS(TOKEN);
                                CREATE INDEX IDX_USER_SESSIONS_EXPIRES_AT ON USER_SESSIONS(EXPIRES_AT);
 
                                -- User activities table
                                CREATE TABLE USER_ACTIVITIES ( ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(), USER_ID UUID NOT NULL REFERENCES USERS(ID) ON DELETE CASCADE, ACTION VARCHAR(100) NOT NULL, RESOURCE VARCHAR(50), -- pond, farm, sensor, etc.
                                RESOURCE_ID UUID, META_DATA TEXT, -- JSON string
                                TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP );
 
                                -- Create indexes on user_activities
                                CREATE INDEX IDX_USER_ACTIVITIES_USER_ID ON USER_ACTIVITIES(USER_ID);
                                CREATE INDEX IDX_USER_ACTIVITIES_ACTION ON USER_ACTIVITIES(ACTION);
                                CREATE INDEX IDX_USER_ACTIVITIES_RESOURCE ON USER_ACTIVITIES(RESOURCE);
                                CREATE INDEX IDX_USER_ACTIVITIES_TIMESTAMP ON USER_ACTIVITIES(TIMESTAMP);
 
                                -- Create function to update updated_at timestamp
                                CREATE OR REPLACE FUNCTION UPDATE_UPDATED_AT_COLUMN() RETURNS TRIGGER AS
                                    $$
                                    BEGIN
                                        NEW.UPDATED_AT = CURRENT_TIMESTAMP;
                                        RETURN NEW;
                                    END;

                                    $$ LANGUAGE 'plpgsql';
 
                                    -- Create triggers for updated_at columns
                                    CREATE TRIGGER UPDATE_USERS_UPDATED_AT BEFORE
                                    UPDATE ON USERS FOR EACH ROW EXECUTE FUNCTION UPDATE_UPDATED_AT_COLUMN(
                                    );
                                    CREATE TRIGGER UPDATE_USER_PREFERENCES_UPDATED_AT BEFORE
                                    UPDATE ON USER_PREFERENCES FOR EACH ROW EXECUTE FUNCTION UPDATE_UPDATED_AT_COLUMN(
                                    );
                                    CREATE TRIGGER UPDATE_FARMS_UPDATED_AT BEFORE
                                    UPDATE ON FARMS FOR EACH ROW EXECUTE FUNCTION UPDATE_UPDATED_AT_COLUMN(
                                    );
                                    CREATE TRIGGER UPDATE_PONDS_UPDATED_AT BEFORE
                                    UPDATE ON PONDS FOR EACH ROW EXECUTE FUNCTION UPDATE_UPDATED_AT_COLUMN(
                                    );
                                    CREATE TRIGGER UPDATE_ALERTS_UPDATED_AT BEFORE
                                    UPDATE ON ALERTS FOR EACH ROW EXECUTE FUNCTION UPDATE_UPDATED_AT_COLUMN(
                                    );
                                    CREATE TRIGGER UPDATE_THRESHOLDS_UPDATED_AT BEFORE
                                    UPDATE ON THRESHOLDS FOR EACH ROW EXECUTE FUNCTION UPDATE_UPDATED_AT_COLUMN(
                                    );
 
                                    -- Insert sample data for testing
                                    INSERT INTO USERS (
                                        EMAIL,
                                        PASSWORD_HASH,
                                        FIRST_NAME,
                                        LAST_NAME,
                                        ROLE
                                    ) VALUES (
                                        'admin@example.com',
                                        '$2b$12$sample_hash',
                                        'Admin',
                                        'User',
                                        'ADMIN'
                                    ), (
                                        'farmer@example.com',
                                        '$2b$12$sample_hash',
                                        'John',
                                        'Farmer',
                                        'FARMER'
                                    ), (
                                        'tech@example.com',
                                        '$2b$12$sample_hash',
                                        'Jane',
                                        'Technician',
                                        'TECHNICIAN'
                                    );
 
                                    -- Insert sample farm
                                    INSERT INTO FARMS (
                                        NAME,
                                        DESCRIPTION,
                                        LOCATION,
                                        LATITUDE,
                                        LONGITUDE,
                                        AREA,
                                        CONTACT_EMAIL,
                                        CONTACT_PHONE
                                    ) VALUES (
                                        'Aqua Farm 1',
                                        'Main aquaculture facility',
                                        'Algiers, Algeria',
                                        36.7538,
                                        3.0588,
                                        10.5,
                                        'contact@aquafarm1.com',
                                        '+213123456789'
                                    );
 
                                    -- Insert sample pond
                                    INSERT INTO PONDS (
                                        FARM_ID,
                                        USER_ID,
                                        NAME,
                                        DESCRIPTION,
                                        TYPE,
                                        LENGTH,
                                        WIDTH,
                                        DEPTH,
                                        VOLUME,
                                        FISH_SPECIES,
                                        FISH_COUNT
                                    ) VALUES (
                                        (SELECT ID FROM FARMS LIMIT 1),
                                        (SELECT ID FROM USERS WHERE ROLE = 'FARMER' LIMIT 1),
                                        'Pond 1',
                                        'Primary breeding pond',
                                        'FRESHWATER',
                                        50.0,
                                        30.0,
                                        3.0,
                                        4500000,
                                        'Tilapia',
                                        1000
                                    );
 
                                    -- Insert sample thresholds
                                    INSERT INTO THRESHOLDS (
                                        POND_ID,
                                        PARAMETER,
                                        MIN_VALUE,
                                        MAX_VALUE,
                                        OPTIMAL_MIN,
                                        OPTIMAL_MAX
                                    ) VALUES (
                                        (SELECT ID FROM PONDS LIMIT 1),
                                        'temperature',
                                        18.0,
                                        32.0,
                                        24.0,
                                        28.0
                                    ), (
                                        (SELECT ID FROM PONDS LIMIT 1),
                                        'ph_level',
                                        6.5,
                                        8.5,
                                        7.0,
                                        8.0
                                    ), (
                                        (SELECT ID FROM PONDS LIMIT 1),
                                        'dissolved_oxygen',
                                        4.0,
                                        15.0,
                                        6.0,
                                        8.0
                                    );
 
                                    -- Comments for documentation
                                    COMMENT ON TABLE USERS IS
                                        'User accounts for the aquaculture management system';
                                        COMMENT ON TABLE FARMS IS
                                            'Aquaculture farms managed by the system';
                                            COMMENT ON TABLE PONDS IS
                                                'Individual ponds within farms';
                                                COMMENT ON TABLE SENSOR_DATA IS
                                                    'Sensor readings from IoT devices monitoring pond conditions';
                                                    COMMENT ON TABLE ALERTS IS
                                                        'System alerts triggered by threshold violations or other events';
                                                        COMMENT ON TABLE THRESHOLDS IS
                                                            'Threshold values for monitoring pond parameters';
                                                            COMMENT ON TABLE USER_SESSIONS IS
                                                                'Active user sessions for authentication';
                                                                COMMENT ON TABLE USER_ACTIVITIES IS
                                                                    'Log of user actions for audit purposes';
                                                                    COMMENT ON TABLE USER_PREFERENCES IS
                                                                        'User-specific preferences and settings';
                                                                        COMMENT ON TABLE FARM_USERS IS
                                                                            'Many-to-many relationship between users and farms';