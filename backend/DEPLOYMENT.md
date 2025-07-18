# Deployment Guide

## Prerequisites

- **Node.js** v16+ installed
- **PostgreSQL** v12+ installed and running
- **Domain name** (for production)
- **SSL Certificate** (recommended)

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/Issamhxr/junctionxalgeria.git
cd junctionxalgeria/backend
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aquaculture_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Alert Thresholds
PH_MIN=6.5
PH_MAX=8.5
TEMPERATURE_MIN=18
TEMPERATURE_MAX=30
DISSOLVED_OXYGEN_MIN=5
NITRITE_MAX=0.5
NITRATE_MAX=40
AMMONIA_MAX=0.25
WATER_LEVEL_MIN=1
WATER_LEVEL_MAX=5
```

### 3. Database Setup

```bash
# Create database
createdb aquaculture_db

# Run migrations
npm run migrate

# Seed demo data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

## Production Deployment

### Option 1: VPS/Cloud Server (Ubuntu)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database and user
createdb aquaculture_db
psql -c "CREATE USER aquaculture_user WITH PASSWORD 'strong_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE aquaculture_db TO aquaculture_user;"
exit
```

#### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/Issamhxr/junctionxalgeria.git
cd junctionxalgeria/backend

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

# Run migrations
npm run migrate

# Optional: Seed initial data
npm run seed
```

#### 4. Process Management with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/app.js --name aquaculture-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 5. Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/aquaculture
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aquaculture /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Generate certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: aquaculture_db
      POSTGRES_USER: aquaculture_user
      POSTGRES_PASSWORD: strong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec app npm run migrate

# View logs
docker-compose logs -f app
```

### Option 3: Heroku Deployment

#### 1. Prepare for Heroku

```bash
# Install Heroku CLI
# Create Procfile
echo "web: npm start" > Procfile

# Add Heroku PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev
```

#### 2. Configure Environment

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_key
heroku config:set EMAIL_HOST=smtp.gmail.com
# ... add other environment variables
```

#### 3. Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Run migrations
heroku run npm run migrate
```

## Environment Variables Reference

### Required Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret

### Optional Variables

- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

## Monitoring and Maintenance

### Health Checks

The API provides a health check endpoint:

```bash
curl http://your-domain.com/health
```

### Logging

Logs are stored in the `logs/` directory:

- `error.log`: Error messages
- `combined.log`: All log messages

### Database Backups

```bash
# Create backup
pg_dump -h localhost -U aquaculture_user aquaculture_db > backup.sql

# Restore backup
psql -h localhost -U aquaculture_user aquaculture_db < backup.sql
```

### PM2 Management

```bash
# View processes
pm2 list

# View logs
pm2 logs aquaculture-api

# Restart application
pm2 restart aquaculture-api

# Monitor resources
pm2 monit
```

## Security Considerations

1. **Use HTTPS** in production
2. **Set strong JWT secret**
3. **Configure firewall** (only allow necessary ports)
4. **Regular security updates**
5. **Database access restrictions**
6. **Rate limiting** (configured by default)
7. **Input validation** (implemented)

## Performance Optimization

1. **Database indexing** (already configured)
2. **Connection pooling** (implemented)
3. **Gzip compression** (enabled)
4. **Caching** (consider Redis for production)
5. **Load balancing** (for high traffic)

## Troubleshooting

### Common Issues

1. **Database connection failed**

   - Check PostgreSQL is running
   - Verify connection credentials
   - Check firewall settings

2. **Port already in use**

   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **PM2 process not starting**

   ```bash
   pm2 delete all
   pm2 start src/app.js --name aquaculture-api
   ```

4. **Nginx 502 Bad Gateway**
   - Check application is running
   - Verify proxy_pass URL
   - Check Nginx error logs

### Log Analysis

```bash
# View application logs
tail -f logs/combined.log

# View error logs only
tail -f logs/error.log

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Scaling Considerations

For high-traffic scenarios:

1. **Horizontal scaling**: Multiple application instances
2. **Database optimization**: Read replicas, connection pooling
3. **Caching layer**: Redis for session management
4. **Load balancer**: Nginx or cloud load balancer
5. **CDN**: For static assets
6. **Monitoring**: Application performance monitoring (APM)

## Support

For deployment issues:

- Check the logs first
- Review this deployment guide
- Create an issue on GitHub
- Contact the development team
