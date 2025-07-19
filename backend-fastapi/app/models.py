from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
from .database import Base

# Enums
class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    FARMER = "FARMER"
    TECHNICIAN = "TECHNICIAN"
    VIEWER = "VIEWER"

class UserStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class PondType(enum.Enum):
    FRESHWATER = "FRESHWATER"
    SALTWATER = "SALTWATER"
    BRACKISH = "BRACKISH"

class AlertType(enum.Enum):
    TEMPERATURE_HIGH = "TEMPERATURE_HIGH"
    TEMPERATURE_LOW = "TEMPERATURE_LOW"
    PH_HIGH = "PH_HIGH"
    PH_LOW = "PH_LOW"
    OXYGEN_LOW = "OXYGEN_LOW"
    OXYGEN_HIGH = "OXYGEN_HIGH"
    TURBIDITY_HIGH = "TURBIDITY_HIGH"
    SYSTEM_ERROR = "SYSTEM_ERROR"
    SENSOR_OFFLINE = "SENSOR_OFFLINE"
    MAINTENANCE_DUE = "MAINTENANCE_DUE"
    FEEDING_REMINDER = "FEEDING_REMINDER"
    WATER_CHANGE = "WATER_CHANGE"

class AlertSeverity(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class FarmUserRole(enum.Enum):
    OWNER = "owner"
    MANAGER = "manager"
    WORKER = "worker"
    VIEWER = "viewer"

class SensorType(enum.Enum):
    TEMPERATURE = "TEMPERATURE"
    PH = "PH"
    OXYGEN = "OXYGEN"
    TURBIDITY = "TURBIDITY"
    DEPTH = "DEPTH"
    FLOW_RATE = "FLOW_RATE"
    CONDUCTIVITY = "CONDUCTIVITY"
    SALINITY = "SALINITY"
    NITRATE = "NITRATE"
    NITRITE = "NITRITE"
    PHOSPHATE = "PHOSPHATE"
    AMMONIA = "AMMONIA"
    WATER_LEVEL = "WATER_LEVEL"

class PondStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    CLOSED = "CLOSED"

# Models
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    language = Column(String(5), default="en")
    last_login = Column(DateTime)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    farm_users = relationship("FarmUser", back_populates="user")
    ponds = relationship("Pond", back_populates="user")
    sensor_data = relationship("SensorData", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    activities = relationship("UserActivity", back_populates="user")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    push_notifications = Column(Boolean, default=True)
    alert_frequency = Column(Integer, default=30)  # minutes
    language = Column(String(5), default="en")
    timezone = Column(String(50), default="UTC")
    dashboard_layout = Column(Text)  # JSON string
    notification_types = Column(Text)  # JSON string
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="preferences")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    area = Column(Float)  # in hectares
    established_date = Column(DateTime)
    license_number = Column(String(100))
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    farm_users = relationship("FarmUser", back_populates="farm")
    ponds = relationship("Pond", back_populates="farm")
    alerts = relationship("Alert", back_populates="farm")

class FarmUser(Base):
    __tablename__ = "farm_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(Enum(FarmUserRole), nullable=False, default=FarmUserRole.VIEWER)
    assigned_at = Column(DateTime, default=func.now())
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relationships
    farm = relationship("Farm", back_populates="farm_users")
    user = relationship("User", back_populates="farm_users")

class Pond(Base):
    __tablename__ = "ponds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(Enum(PondType), nullable=False, default=PondType.FRESHWATER)
    length = Column(Float)  # in meters
    width = Column(Float)   # in meters
    depth = Column(Float)   # in meters
    volume = Column(Float) # in liters
    fish_species = Column(String(255))
    fish_count = Column(Integer, default=0)
    stocking_density = Column(Float)  # fish per cubic meter
    feeding_schedule = Column(Text)
    status = Column(Enum(PondStatus), default=PondStatus.ACTIVE)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    farm = relationship("Farm", back_populates="ponds")
    user = relationship("User", back_populates="ponds")
    sensor_data = relationship("SensorData", back_populates="pond")
    alerts = relationship("Alert", back_populates="pond")
    thresholds = relationship("Threshold", back_populates="pond")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pond_id = Column(UUID(as_uuid=True), ForeignKey("ponds.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    sensor_type = Column(Enum(SensorType))
    temperature = Column(Float)  # Celsius
    ph_level = Column(Float)     # pH scale
    dissolved_oxygen = Column(Float)  # mg/L
    turbidity = Column(Float)    # NTU
    ammonia_level = Column(Float)  # mg/L
    nitrite_level = Column(Float)  # mg/L
    nitrate_level = Column(Float)  # mg/L
    salinity = Column(Float)     # ppt
    water_level = Column(Float)  # meters
    flow_rate = Column(Float)    # L/min
    value = Column(Float)
    unit = Column(String(20))
    timestamp = Column(DateTime, default=func.now())
    quality = Column(String(20))  # GOOD, WARNING, CRITICAL
    device_id = Column(String(50))
    location = Column(String(255))  # GPS coordinates or zone identifier
    meta_data = Column(Text)  # JSON string
    created_at = Column(DateTime, default=func.now())

    # Relationships
    pond = relationship("Pond", back_populates="sensor_data")
    user = relationship("User", back_populates="sensor_data")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id"), nullable=False)
    pond_id = Column(UUID(as_uuid=True), ForeignKey("ponds.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False, default=AlertSeverity.LOW)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    parameter = Column(String(50))  # which parameter triggered the alert
    current_value = Column(Float)  # current value of the parameter
    threshold_value = Column(Float)  # threshold value that was exceeded
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    meta_data = Column(Text)  # JSON string
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    farm = relationship("Farm", back_populates="alerts")
    pond = relationship("Pond", back_populates="alerts")
    user = relationship("User", back_populates="alerts")

class Threshold(Base):
    __tablename__ = "thresholds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pond_id = Column(UUID(as_uuid=True), ForeignKey("ponds.id"), nullable=False)
    parameter = Column(String(50), nullable=False)  # temperature, ph_level, etc.
    min_value = Column(Float)
    max_value = Column(Float)
    optimal_min = Column(Float)
    optimal_max = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    pond = relationship("Pond", back_populates="thresholds")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="sessions")

class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    resource = Column(String(50))  # pond, farm, sensor, etc.
    resource_id = Column(UUID(as_uuid=True))
    meta_data = Column(Text)  # JSON string
    timestamp = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="activities")
