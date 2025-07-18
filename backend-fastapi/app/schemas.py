from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FARMER = "FARMER"
    TECHNICIAN = "TECHNICIAN"
    VIEWER = "VIEWER"

class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class PondType(str, Enum):
    FRESHWATER = "FRESHWATER"
    SALTWATER = "SALTWATER"
    BRACKISH = "BRACKISH"

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

# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.VIEWER
    status: UserStatus = UserStatus.ACTIVE
    language: str = "en"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    language: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID
    email_verified: bool
    phone_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Farm schemas
class FarmBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area: Optional[float] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area: Optional[float] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class FarmResponse(FarmBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Pond schemas
class PondBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: PondType = PondType.FRESHWATER
    length: Optional[float] = None
    width: Optional[float] = None
    depth: Optional[float] = None
    volume: Optional[float] = None
    fish_species: Optional[str] = None
    fish_count: Optional[int] = 0
    stocking_density: Optional[float] = None
    feeding_schedule: Optional[str] = None
    status: PondStatus = PondStatus.ACTIVE

class PondCreate(PondBase):
    farm_id: uuid.UUID

class PondUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[PondType] = None
    length: Optional[float] = None
    width: Optional[float] = None
    depth: Optional[float] = None
    volume: Optional[float] = None
    fish_species: Optional[str] = None
    fish_count: Optional[int] = None
    stocking_density: Optional[float] = None
    feeding_schedule: Optional[str] = None
    status: Optional[PondStatus] = None

class PondResponse(PondBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Sensor Data schemas
class SensorDataBase(BaseModel):
    sensor_type: Optional[SensorType] = None
    temperature: Optional[float] = None
    ph_level: Optional[float] = None
    dissolved_oxygen: Optional[float] = None
    turbidity: Optional[float] = None
    ammonia_level: Optional[float] = None
    nitrite_level: Optional[float] = None
    nitrate_level: Optional[float] = None
    salinity: Optional[float] = None
    water_level: Optional[float] = None
    flow_rate: Optional[float] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    quality: Optional[str] = None
    device_id: Optional[str] = None
    location: Optional[str] = None
    meta_data: Optional[str] = None

class SensorDataCreate(SensorDataBase):
    pond_id: uuid.UUID

class SensorDataResponse(SensorDataBase):
    id: uuid.UUID
    pond_id: uuid.UUID
    user_id: uuid.UUID
    timestamp: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# Alert schemas
class AlertBase(BaseModel):
    type: AlertType
    severity: AlertSeverity = AlertSeverity.LOW
    title: str
    message: str
    parameter: Optional[str] = None
    current_value: Optional[float] = None
    threshold_value: Optional[float] = None
    is_read: bool = False
    is_resolved: bool = False
    meta_data: Optional[str] = None

class AlertCreate(AlertBase):
    farm_id: uuid.UUID
    pond_id: uuid.UUID

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_resolved: Optional[bool] = None
    resolved_at: Optional[datetime] = None

class AlertResponse(AlertBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    pond_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Threshold schemas
class ThresholdBase(BaseModel):
    parameter: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    optimal_min: Optional[float] = None
    optimal_max: Optional[float] = None
    is_active: bool = True

class ThresholdCreate(ThresholdBase):
    pond_id: uuid.UUID

class ThresholdUpdate(BaseModel):
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    optimal_min: Optional[float] = None
    optimal_max: Optional[float] = None
    is_active: Optional[bool] = None

class ThresholdResponse(ThresholdBase):
    id: uuid.UUID
    pond_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# User Preferences schemas
class UserPreferencesBase(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = False
    push_notifications: bool = True
    alert_frequency: int = 30
    language: str = "en"
    timezone: str = "UTC"
    dashboard_layout: Optional[str] = None
    notification_types: Optional[str] = None

class UserPreferencesCreate(UserPreferencesBase):
    pass

class UserPreferencesUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    alert_frequency: Optional[int] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    dashboard_layout: Optional[str] = None
    notification_types: Optional[str] = None

class UserPreferencesResponse(UserPreferencesBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
