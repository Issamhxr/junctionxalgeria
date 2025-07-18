// Type definitions for the API responses
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'ADMIN' | 'FARMER' | 'TECHNICIAN' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  language: string;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  name: string;
  description?: string;
  location: string;
  area: number;
  established_date: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  created_at: string;
  updated_at: string;
}

export interface Pond {
  id: string;
  farm_id: string;
  name: string;
  description?: string;
  type: 'FRESHWATER' | 'SALTWATER' | 'BRACKISH';
  area: number;
  depth: number;
  volume: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export interface SensorData {
  id: string;
  pond_id: string;
  sensor_type: 'TEMPERATURE' | 'PH' | 'OXYGEN' | 'TURBIDITY' | 'DEPTH' | 'FLOW_RATE' | 'CONDUCTIVITY' | 'SALINITY' | 'NITRATE' | 'PHOSPHATE' | 'AMMONIA';
  value: number;
  unit: string;
  timestamp: string;
  created_at: string;
}

export interface Alert {
  id: string;
  farm_id: string;
  pond_id?: string;
  alert_type: 'TEMPERATURE_HIGH' | 'TEMPERATURE_LOW' | 'PH_HIGH' | 'PH_LOW' | 'OXYGEN_LOW' | 'OXYGEN_HIGH' | 'TURBIDITY_HIGH' | 'SYSTEM_ERROR' | 'SENSOR_OFFLINE' | 'MAINTENANCE_DUE' | 'FEEDING_REMINDER' | 'WATER_CHANGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CreateFarmRequest {
  name: string;
  description?: string;
  location: string;
  area: number;
  established_date: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
}

export interface CreatePondRequest {
  farm_id: string;
  name: string;
  description?: string;
  type: 'FRESHWATER' | 'SALTWATER' | 'BRACKISH';
  area: number;
  depth: number;
  volume: number;
}

export interface CreateAlertRequest {
  farm_id: string;
  pond_id?: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
}

export interface AddSensorDataRequest {
  pond_id: string;
  sensor_type: string;
  value: number;
  unit: string;
}
