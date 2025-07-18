# 🧪 Postman Testing Guide - JunctionX Algeria Aquaculture API

## 🚀 Server Status
- **Server URL:** http://localhost:5000
- **API Base:** http://localhost:5000/api
- **Status:** ✅ Running

## 📂 Import Collection
1. Open Postman
2. Click "Import" 
3. Import `postman-collection.json` from this folder
4. Collection will include authentication and all endpoints

## 🔐 Step 1: Authentication
**Endpoint:** POST `/api/auth/login`
```json
{
  "email": "admin@aquaculture.dz",
  "password": "demo123"
}
```
**Expected Response:** 200 OK with JWT token
**Note:** The collection will automatically save the token for other requests

## 👥 Demo Accounts
- **Admin:** admin@aquaculture.dz / demo123
- **Farmer 1:** farmer1@aquaculture.dz / demo123  
- **Farmer 2:** farmer2@aquaculture.dz / demo123

## 🏊 Step 2: Test Pond Endpoints

### Get All Ponds
**GET** `/api/ponds`

### Get Specific Pond
**GET** `/api/ponds/{POND_ID}`
Use these pond IDs:
- `cmd894bm7000agq0u6nd0a6nd` (Bassin Principal A1)
- `cmd894bme000cgq0ui603si4l` (Bassin Reproduction B1)

## 📊 Step 3: Test Sensor Data

### Get Latest Sensor Reading
**GET** `/api/sensors/latest/{POND_ID}`
Example: `/api/sensors/latest/cmd894bm7000agq0u6nd0a6nd`

### Get Sensor Data History
**GET** `/api/sensors/data/{POND_ID}?limit=20`

### Add New Sensor Reading
**POST** `/api/sensors/data`
```json
{
  "pondId": "cmd894bm7000agq0u6nd0a6nd",
  "temperature": 24.5,
  "phLevel": 7.2,
  "dissolvedOxygen": 8.5,
  "turbidity": 15.2,
  "ammoniaLevel": 0.3
}
```

## 🚨 Step 4: Test Alerts

### Get All Alerts
**GET** `/api/alerts`

### Get Active Alerts
**GET** `/api/alerts/active`

### Acknowledge Alert
**POST** `/api/alerts/acknowledge/{ALERT_ID}`
Use these alert IDs:
- `cmd894bqm00acgq0u0orzvym5` (High temperature alert)
- `cmd894bqm00adgq0ub11e499n` (pH level alert)

## 📈 Step 5: Test Dashboard

### Dashboard Overview
**GET** `/api/dashboard/overview`

### Pond Analytics
**GET** `/api/dashboard/analytics/{POND_ID}?period=7d`

## ✅ Expected Results

### Successful Login Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@aquaculture.dz",
      "role": "ADMIN"
    }
  }
}
```

### Successful Pond Data Response:
```json
{
  "success": true,
  "data": {
    "ponds": [
      {
        "id": "cmd894bm7000agq0u6nd0a6nd",
        "name": "Bassin Principal A1",
        "type": "SALTWATER",
        "fishSpecies": "Sea Bass (Dicentrarchus labrax)",
        "fishCount": 2500
      }
    ]
  }
}
```

## 🔧 Troubleshooting

### 401 Unauthorized Error
- Make sure you logged in first
- Check if the auth token is set in collection variables
- Token expires after 7 days

### 404 Not Found
- Check the endpoint URL
- Verify the ID exists in the database
- Make sure server is running on port 5000

### 500 Internal Server Error
- Check server console for error details
- Verify database connection
- Check if PostgreSQL is running

## 🎯 Test Scenarios

1. **Basic Authentication Flow**
   - Login → Get Profile → Update Profile

2. **Pond Management**
   - List Ponds → Get Pond Details → View Sensor Data

3. **Alert Management**
   - View Alerts → Acknowledge Alert → Resolve Alert

4. **Real-time Monitoring**
   - Add Sensor Data → Check for New Alerts → View Dashboard

5. **Admin Functions**
   - Manage Users → View All Farms → System Statistics

## 🚀 Success Criteria
- All endpoints return 200/201 responses
- Authentication works correctly
- Data is retrieved and displayed properly
- CRUD operations work as expected
- Error handling returns appropriate status codes

Happy Testing! 🐟🇩🇿
