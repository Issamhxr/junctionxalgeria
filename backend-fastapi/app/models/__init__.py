from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    FARMER = "FARMER"
    TECHNICIAN = "TECHNICIAN"
    VIEWER = "VIEWER"


class PondStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    CLOSED = "CLOSED"


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
    PHOSPHATE = "PHOSPHATE"
    AMMONIA = "AMMONIA"


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


class ActivityType(enum.Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    POND_CREATED = "POND_CREATED"
    POND_UPDATED = "POND_UPDATED"
    POND_DELETED = "POND_DELETED"
    SENSOR_DATA_ADDED = "SENSOR_DATA_ADDED"
    ALERT_CREATED = "ALERT_CREATED"
    ALERT_RESOLVED = "ALERT_RESOLVED"
    SETTINGS_CHANGED = "SETTINGS_CHANGED"
    REPORT_GENERATED = "REPORT_GENERATED"


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.FARMER)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    alerts = relationship("Alert", back_populates="user")
    farms = relationship("FarmUser", back_populates="user")
    ponds = relationship("Pond", back_populates="user")
    sensorData = relationship("SensorData", back_populates="user")
    activities = relationship("UserActivity", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")


class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    region = Column(String)
    manager = Column(String)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("FarmUser", back_populates="farm")
    ponds = relationship("Pond", back_populates="farm")


class FarmUser(Base):
    __tablename__ = "farm_users"
    
    id = Column(String, primary_key=True, index=True)
    userId = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    farmId = Column(String, ForeignKey("farms.id", ondelete="CASCADE"))
    
    # Relationships
    user = relationship("User", back_populates="farms")
    farm = relationship("Farm", back_populates="users")


class Pond(Base):
    __tablename__ = "ponds"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    farmId = Column(String, ForeignKey("farms.id", ondelete="CASCADE"))
    userId = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    depth = Column(Float)
    area = Column(Float)
    volume = Column(Float)
    fishSpecies = Column(String)
    temperature = Column(Float)
    ph = Column(Float)
    oxygen = Column(Float)
    turbidity = Column(Float)
    status = Column(Enum(PondStatus), default=PondStatus.ACTIVE)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    alerts = relationship("Alert", back_populates="pond")
    analytics = relationship("PondAnalytics", back_populates="pond")
    farm = relationship("Farm", back_populates="ponds")
    user = relationship("User", back_populates="ponds")
    sensorData = relationship("SensorData", back_populates="pond")


class SensorData(Base):
    __tablename__ = "sensor_data"
    
    id = Column(String, primary_key=True, index=True)
    pondId = Column(String, ForeignKey("ponds.id", ondelete="CASCADE"), index=True)
    userId = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    sensorType = Column(Enum(SensorType), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    quality = Column(String)
    deviceId = Column(String)
    location = Column(String)
    metadata = Column(JSON)
    
    # Relationships
    pond = relationship("Pond", back_populates="sensorData")
    user = relationship("User", back_populates="sensorData")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, index=True)
    pondId = Column(String, ForeignKey("ponds.id", ondelete="CASCADE"), index=True)
    userId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    message = Column(String, nullable=False)
    isRead = Column(Boolean, default=False)
    isResolved = Column(Boolean, default=False)
    resolvedAt = Column(DateTime(timezone=True))
    resolvedBy = Column(String)
    metadata = Column(JSON)
    createdAt = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    pond = relationship("Pond", back_populates="alerts")
    user = relationship("User", back_populates="alerts")


class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, index=True)
    userId = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    token = Column(String, unique=True, index=True)
    ipAddress = Column(String)
    userAgent = Column(String)
    expiresAt = Column(DateTime(timezone=True), index=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sessions")


class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(String, primary_key=True, index=True)
    userId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    action = Column(Enum(ActivityType), nullable=False)
    resource = Column(String)
    resourceId = Column(String)
    metadata = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="activities")


class PondAnalytics(Base):
    __tablename__ = "pond_analytics"
    
    id = Column(String, primary_key=True, index=True)
    pondId = Column(String, ForeignKey("ponds.id", ondelete="CASCADE"))
    date = Column(DateTime(timezone=True), index=True)
    avgTemperature = Column(Float)
    avgPh = Column(Float)
    avgOxygen = Column(Float)
    avgTurbidity = Column(Float)
    minTemperature = Column(Float)
    maxTemperature = Column(Float)
    minPh = Column(Float)
    maxPh = Column(Float)
    minOxygen = Column(Float)
    maxOxygen = Column(Float)
    dataPoints = Column(Integer, default=0)
    alertsCount = Column(Integer, default=0)
    criticalEvents = Column(Integer, default=0)
    
    # Relationships
    pond = relationship("Pond", back_populates="analytics")


class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(String, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), unique=True, index=True)
    totalUsers = Column(Integer, default=0)
    activeUsers = Column(Integer, default=0)
    totalPonds = Column(Integer, default=0)
    activePonds = Column(Integer, default=0)
    totalSensorData = Column(Integer, default=0)
    totalAlerts = Column(Integer, default=0)
    criticalAlerts = Column(Integer, default=0)
    systemHealth = Column(String, default="HEALTHY")