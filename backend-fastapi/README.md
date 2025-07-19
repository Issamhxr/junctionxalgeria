# FastAPI Aquaculture Management System

This is a FastAPI-based backend for the JunctionX Algeria Challenge 4 aquaculture management system.

## Features

- 🐟 **Pond Management**: Create, update, and monitor fish ponds
- 📊 **Sensor Data**: Collect and analyze water quality data
- 🚨 **Alert System**: Real-time alerts for water quality issues
- 👥 **User Management**: Role-based access control
- 🏢 **Farm Management**: Multi-farm support
- 🔒 **Authentication**: JWT-based authentication
- 📱 **REST API**: RESTful API endpoints nn

## Tech Stack

- **FastAPI**: Modern, fast web framework
- **PostgreSQL**: Database
- **SQLAlchemy**: ORM
- **Pydantic**: Data validation
- **JWT**: Authentication
- **Uvicorn**: ASGI server

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```
DATABASE_URL=postgresql://username:password@localhost/dbname
SECRET_KEY=your-secret-key
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Models

- **User**: User accounts with role-based access
- **Farm**: Aquaculture farm information
- **Pond**: Individual fish ponds
- **SensorData**: Water quality measurements
- **Alert**: System alerts and notifications
- **Threshold**: Parameter thresholds for alerts

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Farms
- `GET /api/v1/farms` - List farms
- `POST /api/v1/farms` - Create farm
- `GET /api/v1/farms/{id}` - Get farm details
- `PUT /api/v1/farms/{id}` - Update farm
- `DELETE /api/v1/farms/{id}` - Delete farm

### Ponds
- `GET /api/v1/ponds` - List ponds
- `POST /api/v1/ponds` - Create pond
- `GET /api/v1/ponds/{id}` - Get pond details
- `PUT /api/v1/ponds/{id}` - Update pond
- `DELETE /api/v1/ponds/{id}` - Delete pond

### Sensor Data
- `GET /api/v1/sensor-data` - List sensor data
- `POST /api/v1/sensor-data` - Add sensor data
- `GET /api/v1/sensor-data/{id}` - Get sensor data
- `GET /api/v1/sensor-data/pond/{pond_id}/latest` - Get latest data

### Alerts
- `GET /api/v1/alerts` - List alerts
- `POST /api/v1/alerts` - Create alert
- `GET /api/v1/alerts/{id}` - Get alert details
- `PUT /api/v1/alerts/{id}` - Update alert
- `DELETE /api/v1/alerts/{id}` - Delete alert
