#!/bin/bash

# Load mock data into PostgreSQL database
# This script will populate the database with realistic test data

echo "🐟 Loading mock data into PostgreSQL database..."

# Check if PostgreSQL is running
if ! docker-compose ps | grep -q postgres; then
    echo "❌ PostgreSQL container is not running. Starting it..."
    docker-compose up -d postgres
    sleep 5
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Execute the mock data script
echo "📊 Inserting mock data..."
docker-compose exec -T postgres psql -U postgres -d aquaculture_db -f /docker-entrypoint-initdb.d/mock_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Mock data loaded successfully!"
    echo "📈 Database now contains:"
    echo "   - 10 users (admins, farmers, technicians, viewers)"
    echo "   - 5 farms across Algeria"
    echo "   - 11 ponds with different fish species"
    echo "   - Recent sensor data with alerts"
    echo "   - System metrics and user activities"
else
    echo "❌ Failed to load mock data"
    exit 1
fi

echo "🚀 You can now test the application with realistic data!"