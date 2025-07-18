@echo off
REM Load mock data into PostgreSQL database
REM This script will populate the database with realistic test data

echo 🐟 Loading mock data into PostgreSQL database...

REM Check if PostgreSQL is running
docker-compose ps | findstr postgres >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL container is not running. Starting it...
    docker-compose up -d postgres
    timeout /t 5 >nul
)

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 3 >nul

REM Execute the mock data script
echo 📊 Inserting mock data...
docker-compose exec -T postgres psql -U postgres -d aquaculture_db -f /docker-entrypoint-initdb.d/mock_data.sql

if %errorlevel% equ 0 (
    echo ✅ Mock data loaded successfully!
    echo 📈 Database now contains:
    echo    - 10 users (admins, farmers, technicians, viewers)
    echo    - 5 farms across Algeria
    echo    - 11 ponds with different fish species
    echo    - Recent sensor data with alerts
    echo    - System metrics and user activities
) else (
    echo ❌ Failed to load mock data
    exit /b 1
)

echo 🚀 You can now test the application with realistic data!
pause