from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FARMER = "FARMER"
    TECHNICIAN = "TECHNICIAN"
    VIEWER = "VIEWER"


class PondStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    MAINTENANCE = "MAINTENANCE"
    CLOSED = "CLOSED"


class SensorType(str, Enum):
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


class AlertType(str, Enum):
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


class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ActivityType(str, Enum):
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


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    firstName: str
    lastName: str
    role: UserRole = UserRole.FARMER


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    role: Optional[UserRole] = None
    isActive: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    isActive: bool
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# Farm schemas
class FarmBase(BaseModel):
    name: str
    location: str
    region: Optional[str] = None
    manager: Optional[str] = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    region: Optional[str] = None
    manager: Optional[str] = None


class FarmResponse(FarmBase):
    id: str
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# Pond schemas
class PondBase(BaseModel):
    name: str
    depth: Optional[float] = None
    area: Optional[float] = None
    volume: Optional[float] = None
    fishSpecies: Optional[str] = None
    status: PondStatus = PondStatus.ACTIVE


class PondCreate(PondBase):
    farmId: str


class PondUpdate(BaseModel):
    name: Optional[str] = None
    depth: Optional[float] = None
    area: Optional[float] = None
    volume: Optional[float] = None
    fishSpecies: Optional[str] = None
    temperature: Optional[float] = None
    ph: Optional[float] = None
    oxygen: Optional[float] = None
    turbidity: Optional[float] = None
    status: Optional[PondStatus] = None


class PondResponse(PondBase):
    id: str
    farmId: str
    userId: str
    temperature: Optional[float] = None
    ph: Optional[float] = None
    oxygen: Optional[float] = None
    turbidity: Optional[float] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# Sensor Data schemas
class SensorDataBase(BaseModel):
    sensorType: SensorType
    value: float
    unit: str
    quality: Optional[str] = None
    deviceId: Optional[str] = None
    location: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SensorDataCreate(SensorDataBase):
    pondId: str


class SensorDataResponse(SensorDataBase):
    id: str
    pondId: str
    userId: str
    timestamp: datetime

    class Config:
        from_attributes = True


# Alert schemas
class AlertBase(BaseModel):
    type: AlertType
    severity: AlertSeverity
    message: str
    metadata: Optional[Dict[str, Any]] = None


class AlertCreate(AlertBase):
    pondId: str


class AlertUpdate(BaseModel):
    type: Optional[AlertType] = None
    severity: Optional[AlertSeverity] = None
    message: Optional[str] = None
    isRead: Optional[bool] = None
    isResolved: Optional[bool] = None
    resolvedBy: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AlertResponse(AlertBase):
    id: str
    pondId: str
    userId: str
    isRead: bool
    isResolved: bool
    resolvedAt: Optional[datetime] = None
    resolvedBy: Optional[str] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# User Activity schemas
class UserActivityBase(BaseModel):
    action: ActivityType
    resource: Optional[str] = None
    resourceId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UserActivityCreate(UserActivityBase):
    pass


class UserActivityResponse(UserActivityBase):
    id: str
    userId: str
    timestamp: datetime

    class Config:
        from_attributes = True


# Pond Analytics schemas
class PondAnalyticsBase(BaseModel):
    date: datetime
    avgTemperature: Optional[float] = None
    avgPh: Optional[float] = None
    avgOxygen: Optional[float] = None
    avgTurbidity: Optional[float] = None
    minTemperature: Optional[float] = None
    maxTemperature: Optional[float] = None
    minPh: Optional[float] = None
    maxPh: Optional[float] = None
    minOxygen: Optional[float] = None
    maxOxygen: Optional[float] = None
    dataPoints: int = 0
    alertsCount: int = 0
    criticalEvents: int = 0


class PondAnalyticsCreate(PondAnalyticsBase):
    pondId: str


class PondAnalyticsResponse(PondAnalyticsBase):
    id: str
    pondId: str

    class Config:
        from_attributes = True


# System Metrics schemas
class SystemMetricsBase(BaseModel):
    date: datetime
    totalUsers: int = 0
    activeUsers: int = 0
    totalPonds: int = 0
    activePonds: int = 0
    totalSensorData: int = 0
    totalAlerts: int = 0
    criticalAlerts: int = 0
    systemHealth: str = "HEALTHY"


class SystemMetricsResponse(SystemMetricsBase):
    id: str

    class Config:
        from_attributes = True


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# Dashboard schemas
class DashboardStats(BaseModel):
    totalPonds: int
    activePonds: int
    totalSensors: int
    totalFarms: int
    activeAlerts: int
    criticalAlerts: int
    recentActivities: List[UserActivityResponse]


class SensorDataStats(BaseModel):
    sensorType: SensorType
    currentValue: float
    minValue: float
    maxValue: float
    avgValue: float
    unit: str
    quality: Optional[str] = None