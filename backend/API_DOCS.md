# API Documentation

## Overview

The Aquaculture Monitoring API provides comprehensive endpoints for managing fish farms, ponds, sensor data, and alerts. This API supports the digitization of aquaculture operations in Algeria.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Description of the result",
  "data": {
    // Response data
  },
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Endpoints

### Authentication

#### POST /auth/register

Register a new user.

**Request Body:**

```json
{
  "username": "farmer1",
  "email": "farmer@example.com",
  "password": "password123",
  "firstName": "Ahmed",
  "lastName": "Benali",
  "phone": "+213555123456",
  "language": "fr"
}
```

#### POST /auth/login

Authenticate user and get JWT token.

**Request Body:**

```json
{
  "email": "farmer@example.com",
  "password": "password123"
}
```

#### GET /auth/me

Get current user information.

**Headers:** `Authorization: Bearer <token>`

### Ponds Management

#### GET /ponds

Get user's ponds with pagination.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by pond name or fish species
- `farm_id`: Filter by farm ID

#### POST /ponds

Create a new pond.

**Request Body:**

```json
{
  "name": "Bassin A1",
  "farm_id": 1,
  "capacity_liters": 50000,
  "depth_meters": 2.5,
  "surface_area_m2": 1000,
  "fish_species": "Carpe commune",
  "fish_count": 500
}
```

#### GET /ponds/:id

Get detailed pond information.

#### PUT /ponds/:id

Update pond information.

#### DELETE /ponds/:id

Delete a pond.

#### GET /ponds/:id/sensor-data

Get historical sensor data for a pond.

**Query Parameters:**

- `start_date`: ISO date string
- `end_date`: ISO date string
- `parameter`: Specific parameter to filter
- `limit`: Number of records
- `page`: Page number

### Sensor Data

#### POST /sensors/data

Add new sensor reading.

**Request Body:**

```json
{
  "pond_id": 1,
  "ph": 7.2,
  "temperature": 24.5,
  "dissolved_oxygen": 8.2,
  "salinity": 2.1,
  "suspended_solids": 15.0,
  "nitrite": 0.1,
  "nitrate": 5.0,
  "ammonia": 0.05,
  "water_level": 3.2,
  "sensor_id": "SENSOR_001"
}
```

#### GET /sensors/data/latest/:pond_id

Get latest sensor reading for a pond.

#### GET /sensors/data/stats/:pond_id

Get statistical summary of sensor data.

**Query Parameters:**

- `period`: Time period (1h, 24h, 7d, 30d)

#### GET /sensors/thresholds/:pond_id

Get alert thresholds for a pond.

#### PUT /sensors/thresholds/:pond_id

Update alert thresholds.

**Request Body:**

```json
{
  "thresholds": [
    {
      "parameter": "ph",
      "min_value": 6.5,
      "max_value": 8.5
    },
    {
      "parameter": "dissolved_oxygen",
      "min_value": 5,
      "max_value": null
    }
  ]
}
```

### Alerts

#### GET /alerts

Get user's alerts with filtering.

**Query Parameters:**

- `page`: Page number
- `limit`: Items per page
- `severity`: Filter by severity (low, medium, high, critical)
- `is_resolved`: Filter by resolution status
- `pond_id`: Filter by pond
- `start_date`: Date range start
- `end_date`: Date range end

#### GET /alerts/stats

Get alert statistics.

**Query Parameters:**

- `period`: Time period (24h, 7d, 30d)

#### PUT /alerts/:id/resolve

Mark an alert as resolved.

#### PUT /alerts/bulk-resolve

Mark multiple alerts as resolved.

**Request Body:**

```json
{
  "alert_ids": [1, 2, 3, 4]
}
```

#### GET /alerts/recent

Get recent unresolved alerts.

**Query Parameters:**

- `limit`: Number of alerts (default: 5)

### Dashboard

#### GET /dashboard/overview

Get dashboard overview statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalFarms": 2,
      "totalPonds": 5,
      "activeAlerts": 3,
      "recentReadings": 45,
      "pondStatusSummary": {
        "active": 4,
        "maintenance": 1
      }
    }
  }
}
```

#### GET /dashboard/pond-health

Get pond health summary.

#### GET /dashboard/alert-trends

Get alert trends over time.

**Query Parameters:**

- `period`: Time period (24h, 7d, 30d)

#### GET /dashboard/parameter-trends/:pond_id

Get parameter trends for a specific pond.

**Query Parameters:**

- `period`: Time period (1h, 24h, 7d, 30d)
- `parameter`: Parameter name (ph, temperature, etc.)

#### GET /dashboard/system-health

Get system health status.

### User Management

#### GET /users/profile

Get user profile information.

#### PUT /users/profile

Update user profile.

**Request Body:**

```json
{
  "firstName": "Ahmed",
  "lastName": "Benali",
  "phone": "+213555123456",
  "language": "fr"
}
```

#### PUT /users/preferences

Update user preferences.

**Request Body:**

```json
{
  "emailAlerts": true,
  "smsAlerts": false,
  "alertFrequency": 30,
  "timezone": "Africa/Algiers"
}
```

#### PUT /users/change-password

Change user password.

**Request Body:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

#### GET /users/farms

Get user's farms.

## WebSocket Events

Connect to WebSocket at `ws://localhost:3000`

### Client Events

#### subscribe_pond

Subscribe to updates for a specific pond.

```javascript
socket.emit("subscribe_pond", pondId);
```

#### unsubscribe_pond

Unsubscribe from pond updates.

```javascript
socket.emit("unsubscribe_pond", pondId);
```

### Server Events

#### sensor_data

Receive new sensor data.

```javascript
socket.on("sensor_data", (data) => {
  console.log("New sensor data:", data);
});
```

#### new_alert

Receive new alert notifications.

```javascript
socket.on("new_alert", (alert) => {
  console.log("New alert:", alert);
});
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

## Data Validation

All input data is validated. Common validation rules:

- **Email**: Must be valid email format
- **Phone**: Must be valid mobile phone number
- **pH**: Must be between 0 and 14
- **Temperature**: Must be between -10°C and 50°C
- **Dissolved Oxygen**: Must be positive number
- **Passwords**: Minimum 6 characters

## Example Usage

### JavaScript/Fetch

```javascript
const response = await fetch("http://localhost:3000/api/ponds", {
  method: "GET",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
});
const data = await response.json();
```

### curl

```bash
curl -X POST http://localhost:3000/api/sensors/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pond_id": 1,
    "ph": 7.2,
    "temperature": 24.5,
    "dissolved_oxygen": 8.2
  }'
```
