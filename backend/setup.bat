@echo off
echo Starting Aquaculture Backend Setup...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL client not found in PATH
    echo Please ensure PostgreSQL is installed and accessible
    echo.
)

echo.
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file with your actual configuration
    echo - Database connection details
    echo - Email settings
    echo - SMS/Twilio settings
    echo - JWT secret
    echo.
) else (
    echo .env file already exists
    echo.
)

echo Setup completed!
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Create PostgreSQL database
echo 3. Run: npm run migrate
echo 4. Run: npm run seed (optional - for demo data)
echo 5. Run: npm run dev (for development)
echo.
pause
