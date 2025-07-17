# JunctionX Algeria Backend

This is the backend API for the JunctionX Algeria water monitoring system built with Express.js, TypeScript, and Prisma.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Support for multiple user roles (Admin, Centre Chief, Base Chief, Operator)
- **Water Monitoring**: Real-time water quality parameter tracking (pH, temperature, oxygen, salinity, turbidity)
- **Alert System**: Automatic alerts when water parameters exceed safe thresholds
- **Data Analytics**: Statistical analysis of water quality readings
- **RESTful API**: Clean, well-documented REST endpoints

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting
- **Validation**: express-validator and Zod

## Installation

1. Clone the repository and navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/junctionxalgeria"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

4. Set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin/Centre Chief)
- `PUT /api/users/:id` - Update user (Admin/Centre Chief)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Centres

- `GET /api/centres` - Get all centres
- `GET /api/centres/:id` - Get centre by ID
- `POST /api/centres` - Create new centre (Admin only)
- `PUT /api/centres/:id` - Update centre (Admin only)
- `DELETE /api/centres/:id` - Delete centre (Admin only)

### Bases

- `GET /api/bases` - Get all bases
- `GET /api/bases/:id` - Get base by ID
- `POST /api/bases` - Create new base (Admin/Centre Chief)
- `PUT /api/bases/:id` - Update base (Admin/Centre Chief)
- `DELETE /api/bases/:id` - Delete base (Admin only)

### Basins

- `GET /api/basins` - Get all basins
- `GET /api/basins/:id` - Get basin by ID
- `POST /api/basins` - Create new basin (Admin/Centre Chief/Base Chief)
- `PUT /api/basins/:id` - Update basin (Admin/Centre Chief/Base Chief)
- `DELETE /api/basins/:id` - Delete basin (Admin/Centre Chief/Base Chief)
- `POST /api/basins/:id/readings` - Add reading to basin (All roles)
- `GET /api/basins/:id/readings` - Get basin readings
- `GET /api/basins/:id/alerts` - Get basin alerts

### Readings

- `GET /api/readings` - Get all readings with filtering
- `GET /api/readings/:id` - Get reading by ID
- `GET /api/readings/stats/summary` - Get readings statistics

## User Roles

1. **ADMIN**: Full system access
2. **CENTRE_CHIEF**: Manage centres and bases
3. **BASE_CHIEF**: Manage specific base and its basins
4. **OPERATOR**: Add readings and view data

## Water Quality Parameters

The system monitors the following parameters:

- **pH**: Normal range 6.0-8.5
- **Temperature**: Normal range 18-30°C
- **Oxygen**: Minimum 4.0 mg/L
- **Salinity**: Maximum 35 ppt
- **Turbidity**: Optional parameter

## Alert System

Automatic alerts are generated when:

- pH is outside the range 6.0-8.5
- Temperature is outside the range 18-30°C
- Oxygen level is below 4.0 mg/L
- Salinity exceeds 35 ppt

## Security Features

- JWT token-based authentication
- Role-based access control
- Password hashing with bcrypt
- Request rate limiting
- CORS protection
- Security headers with Helmet
- Input validation and sanitization

## Database Schema

The system uses the following main entities:

- **User**: System users with different roles
- **Centre**: Regional water monitoring centres
- **Base**: Local monitoring stations
- **Basin**: Individual water basins being monitored
- **Reading**: Water quality measurements
- **Alert**: Automatic alerts for parameter violations

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
