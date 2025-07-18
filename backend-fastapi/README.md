# FastAPI Aquaculture Management System

A comprehensive backend system for smart aquaculture monitoring and management built with FastAPI, PostgreSQL, and modern Python technologies.

## Features

- **User Management**: Registration, authentication, and role-based access control
- **Pond Management**: Create, update, and monitor fish ponds
- **Sensor Integration**: Manage IoT sensors and collect real-time data
- **Alert System**: Automated threshold monitoring and alert generation
- **Dashboard Analytics**: Real-time statistics and data visualization
- **RESTful API**: Complete REST API with OpenAPI documentation

## Tech Stack

- **Backend**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Documentation**: Automatic OpenAPI/Swagger documentation
- **Background Tasks**: Celery with Redis
- **Deployment**: Docker support

## Quick Start

1. **Install Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start the Server**

   ```bash
   python start.py
   ```

4. **Access API Documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123
- **Email**: admin@aquaculture.com

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user info

### Ponds

- `GET /api/v1/ponds` - List all ponds
- `POST /api/v1/ponds` - Create new pond
- `GET /api/v1/ponds/{id}` - Get pond details
- `PUT /api/v1/ponds/{id}` - Update pond
- `DELETE /api/v1/ponds/{id}` - Delete pond

### Sensors

- `GET /api/v1/sensors` - List all sensors
- `POST /api/v1/sensors` - Create new sensor
- `GET /api/v1/sensors/{id}` - Get sensor details
- `PUT /api/v1/sensors/{id}` - Update sensor
- `DELETE /api/v1/sensors/{id}` - Delete sensor

### Sensor Data

- `GET /api/v1/sensor-data` - Get sensor readings
- `POST /api/v1/sensor-data` - Add sensor reading
- `GET /api/v1/sensor-data/stats/{pond_id}` - Get pond statistics

### Alerts

- `GET /api/v1/alerts` - List all alerts
- `POST /api/v1/alerts` - Create new alert
- `GET /api/v1/alerts/{id}` - Get alert details
- `PUT /api/v1/alerts/{id}` - Update alert
- `GET /api/v1/alerts/dashboard/stats` - Get dashboard statistics

## Database Schema

### Users

- User authentication and profile management
- Role-based access control (Admin, Farm Manager, Technician)

### Ponds

- Pond information and management
- Fish species and capacity tracking

### Sensors

- IoT sensor registration and management
- Support for multiple sensor types (temperature, pH, dissolved oxygen, etc.)

### Sensor Data

- Real-time sensor readings storage
- Historical data tracking

### Alerts

- Automated alert generation based on thresholds
- Alert severity levels and status tracking

## Configuration

Environment variables in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/aquaculture_db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

## Development

1. **Database Migrations**

   ```bash
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

2. **Run Tests**

   ```bash
   pytest
   ```

3. **Code Formatting**
   ```bash
   black .
   isort .
   ```

## Deployment

The system is Docker-ready and can be deployed to any cloud platform supporting containers.

## License

MIT License - see LICENSE file for details.
