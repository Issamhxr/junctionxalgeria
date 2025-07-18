# 🐟 Smart Aquaculture Backend - JunctionX Algeria Challenge 4

A comprehensive backend API for digitizing aquaculture in Algeria, providing real-time monitoring, intelligent alerts, and data-driven insights for fish farms.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment:**

```bash
# Edit .env file with your database and service credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/aquaculture_db"
JWT_SECRET="your_super_secret_jwt_key"
# ... other configurations
```

3. **Set up database:**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed with demo data
npm run db:seed
```

4. **Start development server:**

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📊 Features

### ✅ Core Functionality

- **User Management** - JWT authentication, role-based access
- **Farm & Pond Management** - Complete CRUD operations
- **Real-time Sensor Data** - Live data collection and streaming
- **Intelligent Alerts** - Automated threshold monitoring
- **SMS Notifications** - SMS alert delivery via Twilio
- **Dashboard Analytics** - Statistical insights and trends
- **Data Simulation** - Built-in testing data generation

### 🏗️ Technical Stack

- **Framework:** Express.js with TypeScript-like structure
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Socket.IO for live data streaming
- **Authentication:** JWT with bcrypt password hashing
- **Validation:** Express-validator for input sanitization
- **Logging:** Winston for comprehensive logging
- **Notifications:** Twilio for SMS alerts
- **Security:** Helmet, CORS, rate limiting

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Pond Management

- `GET /api/ponds` - List all ponds
- `POST /api/ponds` - Create new pond
- `GET /api/ponds/:id` - Get pond details
- `PUT /api/ponds/:id` - Update pond
- `DELETE /api/ponds/:id` - Delete pond

### Sensor Data

- `GET /api/sensors/data/:pondId` - Get sensor readings
- `POST /api/sensors/data` - Add sensor reading
- `GET /api/sensors/stats/:pondId` - Get statistics
- `GET /api/sensors/latest/:pondId` - Get latest reading

### Alerts

- `GET /api/alerts` - List alerts
- `GET /api/alerts/active` - Active alerts only
- `POST /api/alerts/acknowledge/:id` - Acknowledge alert
- `POST /api/alerts/resolve/:id` - Resolve alert
- `GET /api/alerts/stats` - Alert statistics

### Dashboard

- `GET /api/dashboard/overview` - Dashboard summary
- `GET /api/dashboard/analytics/:pondId` - Pond analytics
- `GET /api/dashboard/farms` - Farms summary

### User Management (Admin)

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/status` - Activate/deactivate user

## 🌐 Real-time Events (WebSocket)

### Client Events

- `joinPond` - Join pond channel for updates
- `leavePond` - Leave pond channel

### Server Events

- `sensorData` - Real-time sensor readings
- `alert` - Instant alert notifications
- `pondUpdate` - Pond status changes

## 🗃️ Database Schema

### Core Tables

- **users** - User accounts and authentication
- **farms** - Fish farm information
- **ponds** - Individual pond details
- **sensor_data** - Real-time sensor readings
- **alerts** - System alerts and notifications
- **thresholds** - Parameter monitoring thresholds
- **user_preferences** - User notification settings
- **activity_logs** - System activity tracking

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRE=7d

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# Simulation
ENABLE_DATA_SIMULATION=true
SIMULATION_INTERVAL=30000
```

## 📱 Demo Accounts

After running the seed script, you can use these demo accounts:

- **Admin:** admin@aquaculture.dz / demo123
- **Farmer 1:** farmer1@aquaculture.dz / demo123
- **Farmer 2:** farmer2@aquaculture.dz / demo123

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📊 Available Scripts

```bash
npm start          # Production server
npm run dev        # Development server with hot reload
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema to database
npm run db:migrate # Run database migrations
npm run db:reset   # Reset database (⚠️ destructive)
npm run db:seed    # Seed database with demo data
npm run db:studio  # Open Prisma Studio (database GUI)
```

## 🔒 Security Features

- **Authentication:** JWT tokens with secure password hashing
- **Authorization:** Role-based access control (RBAC)
- **Input Validation:** Express-validator for all endpoints
- **Rate Limiting:** Prevents API abuse
- **CORS Protection:** Configurable cross-origin policies
- **SQL Injection Prevention:** Prisma ORM provides protection
- **XSS Protection:** Helmet middleware

## 📈 Monitoring & Alerts

### Alert Types

- **THRESHOLD_EXCEEDED** - Parameter outside safe range
- **SENSOR_MALFUNCTION** - Sensor not responding
- **SYSTEM_ERROR** - System-level issues
- **MAINTENANCE_DUE** - Scheduled maintenance reminders
- **FISH_HEALTH** - Health-related alerts
- **WATER_QUALITY** - Water quality issues

### Severity Levels

- **LOW** - Informational alerts
- **MEDIUM** - Warning conditions
- **HIGH** - Urgent attention required
- **CRITICAL** - Immediate action needed

## 🌍 Multi-language Support

The system supports multiple languages for alerts and notifications:

- **English (en)** - Default
- **French (fr)** - Français
- **Arabic (ar)** - العربية

## 🚀 Deployment

### Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up email/SMS services
4. Configure proper JWT secrets
5. Set up reverse proxy (nginx)
6. Enable SSL/HTTPS

### Docker Deployment

```bash
# Build image
docker build -t aquaculture-backend .

# Run container
docker run -d -p 5000:5000 --env-file .env aquaculture-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 JunctionX Algeria Challenge 4

This backend was built for **Challenge 4: Digitizing Aquaculture in Algeria for Smart and Responsive Management of Fish Ponds** by Cosider.

### Challenge Goals Achieved ✅

- ✅ Real-time pond monitoring
- ✅ Automated alert system
- ✅ Data-driven insights
- ✅ Multi-language support
- ✅ Scalable architecture
- ✅ Production-ready deployment

---

**Built with ❤️ for sustainable aquaculture in Algeria** 🇩🇿
