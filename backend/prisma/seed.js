const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 12);
  
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@aquaculture.dz',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const farmer1 = await prisma.user.create({
    data: {
      username: 'farmer1',
      email: 'farmer1@aquaculture.dz',
      password: hashedPassword,
      firstName: 'Ahmed',
      lastName: 'Benali',
      role: 'FARMER',
    },
  });

  const farmer2 = await prisma.user.create({
    data: {
      username: 'farmer2',
      email: 'farmer2@aquaculture.dz',
      password: hashedPassword,
      firstName: 'Fatima',
      lastName: 'Benaissa',
      role: 'FARMER',
    },
  });

  console.log('✅ Users created');

  // Create demo farms
  const farm1 = await prisma.farm.create({
    data: {
      name: 'Ferme Aquacole de Tipaza',
      location: 'Tipaza, Algeria',
      description: 'Modern fish farming facility specializing in sea bass and sea bream',
      coordinates: { lat: 36.5889, lng: 2.4463 },
    },
  });

  const farm2 = await prisma.farm.create({
    data: {
      name: 'Complexe Piscicole d\'Oran',
      location: 'Oran, Algeria',
      description: 'Large scale aquaculture complex with multiple pond systems',
      coordinates: { lat: 35.6969, lng: -0.6331 },
    },
  });

  console.log('✅ Farms created');

  // Create farm user relationships
  await prisma.farmUser.createMany({
    data: [
      { userId: farmer1.id, farmId: farm1.id, role: 'owner' },
      { userId: farmer2.id, farmId: farm2.id, role: 'owner' },
      { userId: admin.id, farmId: farm1.id, role: 'manager' },
      { userId: admin.id, farmId: farm2.id, role: 'manager' },
    ],
  });

  console.log('✅ Farm users assigned');

  // Create demo ponds
  const pond1 = await prisma.pond.create({
    data: {
      farmId: farm1.id,
      name: 'Bassin Principal A1',
      type: 'saltwater',
      volume: 5000,
      depth: 3.5,
      temperature: 18.5,
      ph: 8.1,
      oxygen: 7.2,
      salinity: 35.0,
    },
  });

  const pond2 = await prisma.pond.create({
    data: {
      farmId: farm1.id,
      name: 'Bassin Reproduction B1',
      type: 'saltwater',
      volume: 2500,
      depth: 2.8,
      temperature: 19.2,
      ph: 8.0,
      oxygen: 6.8,
      salinity: 34.5,
    },
  });

  const pond3 = await prisma.pond.create({
    data: {
      farmId: farm2.id,
      name: 'Étang Principal C1',
      type: 'freshwater',
      volume: 8000,
      depth: 4.0,
      temperature: 16.8,
      ph: 7.5,
      oxygen: 8.1,
      salinity: 0.5,
    },
  });

  const pond4 = await prisma.pond.create({
    data: {
      farmId: farm2.id,
      name: 'Bassin Nurserie C2',
      type: 'freshwater',
      volume: 1500,
      depth: 1.8,
      temperature: 17.5,
      ph: 7.3,
      oxygen: 7.9,
      salinity: 0.3,
    },
  });

  console.log('✅ Ponds created');

  // Create thresholds for each pond
  const thresholds = [
    // Pond 1 thresholds (saltwater)
    { pondId: pond1.id, parameter: 'TEMPERATURE', minValue: 16.0, maxValue: 22.0, criticalMin: 14.0, criticalMax: 25.0 },
    { pondId: pond1.id, parameter: 'PH', minValue: 7.8, maxValue: 8.3, criticalMin: 7.5, criticalMax: 8.5 },
    { pondId: pond1.id, parameter: 'OXYGEN', minValue: 6.0, maxValue: 9.0, criticalMin: 5.0, criticalMax: 12.0 },
    { pondId: pond1.id, parameter: 'SALINITY', minValue: 32.0, maxValue: 37.0, criticalMin: 30.0, criticalMax: 40.0 },
    
    // Pond 2 thresholds (saltwater)
    { pondId: pond2.id, parameter: 'TEMPERATURE', minValue: 17.0, maxValue: 21.0, criticalMin: 15.0, criticalMax: 24.0 },
    { pondId: pond2.id, parameter: 'PH', minValue: 7.9, maxValue: 8.2, criticalMin: 7.6, criticalMax: 8.4 },
    { pondId: pond2.id, parameter: 'OXYGEN', minValue: 6.5, maxValue: 8.5, criticalMin: 5.5, criticalMax: 11.0 },
    { pondId: pond2.id, parameter: 'SALINITY', minValue: 33.0, maxValue: 36.0, criticalMin: 31.0, criticalMax: 38.0 },
    
    // Pond 3 thresholds (freshwater)
    { pondId: pond3.id, parameter: 'TEMPERATURE', minValue: 15.0, maxValue: 20.0, criticalMin: 12.0, criticalMax: 23.0 },
    { pondId: pond3.id, parameter: 'PH', minValue: 7.0, maxValue: 8.0, criticalMin: 6.5, criticalMax: 8.5 },
    { pondId: pond3.id, parameter: 'OXYGEN', minValue: 7.0, maxValue: 10.0, criticalMin: 6.0, criticalMax: 12.0 },
    { pondId: pond3.id, parameter: 'SALINITY', minValue: 0.0, maxValue: 1.0, criticalMin: 0.0, criticalMax: 2.0 },
    
    // Pond 4 thresholds (freshwater)
    { pondId: pond4.id, parameter: 'TEMPERATURE', minValue: 16.0, maxValue: 19.0, criticalMin: 13.0, criticalMax: 22.0 },
    { pondId: pond4.id, parameter: 'PH', minValue: 7.2, maxValue: 7.8, criticalMin: 6.8, criticalMax: 8.2 },
    { pondId: pond4.id, parameter: 'OXYGEN', minValue: 7.5, maxValue: 9.5, criticalMin: 6.5, criticalMax: 11.5 },
    { pondId: pond4.id, parameter: 'SALINITY', minValue: 0.0, maxValue: 0.5, criticalMin: 0.0, criticalMax: 1.0 },
  ];

  await prisma.threshold.createMany({
    data: thresholds,
  });

  console.log('✅ Thresholds created');

  // Create user preferences
  await prisma.userPreference.createMany({
    data: [
      {
        userId: admin.id,
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: true,
        alertSeverity: 'medium',
        language: 'en',
        timezone: 'Africa/Algiers',
      },
      {
        userId: farmer1.id,
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        alertSeverity: 'high',
        language: 'fr',
        timezone: 'Africa/Algiers',
      },
      {
        userId: farmer2.id,
        emailAlerts: true,
        smsAlerts: true,
        pushNotifications: true,
        alertSeverity: 'medium',
        language: 'ar',
        timezone: 'Africa/Algiers',
      },
    ],
  });

  console.log('✅ User preferences created');

  // Create some historical sensor data
  const now = new Date();
  const sensorDataEntries = [];

  // Generate 7 days of historical data
  for (let day = 6; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour += 2) { // Every 2 hours
      const timestamp = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) + (hour * 60 * 60 * 1000));
      
      // Pond 1 data (saltwater)
      sensorDataEntries.push({
        pondId: pond1.id,
        temperature: 18.5 + (Math.random() - 0.5) * 2,
        ph: 8.1 + (Math.random() - 0.5) * 0.4,
        oxygen: 7.2 + (Math.random() - 0.5) * 1.5,
        salinity: 35.0 + (Math.random() - 0.5) * 2,
        turbidity: 2.0 + Math.random() * 3,
        ammonia: 0.1 + Math.random() * 0.3,
        nitrite: 0.05 + Math.random() * 0.1,
        nitrate: 1.0 + Math.random() * 2,
        timestamp,
      });

      // Pond 2 data (saltwater)
      sensorDataEntries.push({
        pondId: pond2.id,
        temperature: 19.2 + (Math.random() - 0.5) * 1.8,
        ph: 8.0 + (Math.random() - 0.5) * 0.3,
        oxygen: 6.8 + (Math.random() - 0.5) * 1.2,
        salinity: 34.5 + (Math.random() - 0.5) * 1.5,
        turbidity: 1.8 + Math.random() * 2.5,
        ammonia: 0.08 + Math.random() * 0.25,
        nitrite: 0.04 + Math.random() * 0.08,
        nitrate: 0.8 + Math.random() * 1.5,
        timestamp,
      });

      // Pond 3 data (freshwater)
      sensorDataEntries.push({
        pondId: pond3.id,
        temperature: 16.8 + (Math.random() - 0.5) * 2.2,
        ph: 7.5 + (Math.random() - 0.5) * 0.5,
        oxygen: 8.1 + (Math.random() - 0.5) * 1.8,
        salinity: 0.5 + (Math.random() - 0.5) * 0.3,
        turbidity: 3.0 + Math.random() * 4,
        ammonia: 0.15 + Math.random() * 0.4,
        nitrite: 0.08 + Math.random() * 0.15,
        nitrate: 2.0 + Math.random() * 3,
        timestamp,
      });

      // Pond 4 data (freshwater)
      sensorDataEntries.push({
        pondId: pond4.id,
        temperature: 17.5 + (Math.random() - 0.5) * 1.5,
        ph: 7.3 + (Math.random() - 0.5) * 0.4,
        oxygen: 7.9 + (Math.random() - 0.5) * 1.3,
        salinity: 0.3 + (Math.random() - 0.5) * 0.2,
        turbidity: 2.5 + Math.random() * 3.5,
        ammonia: 0.12 + Math.random() * 0.35,
        nitrite: 0.06 + Math.random() * 0.12,
        nitrate: 1.5 + Math.random() * 2.5,
        timestamp,
      });
    }
  }

  // Insert sensor data in batches
  const batchSize = 100;
  for (let i = 0; i < sensorDataEntries.length; i += batchSize) {
    const batch = sensorDataEntries.slice(i, i + batchSize);
    await prisma.sensorData.createMany({
      data: batch,
    });
  }

  console.log(`✅ ${sensorDataEntries.length} sensor data entries created`);

  // Create some sample alerts
  await prisma.alert.createMany({
    data: [
      {
        pondId: pond1.id,
        farmId: farm1.id,
        userId: farmer1.id,
        type: 'THRESHOLD_EXCEEDED',
        severity: 'HIGH',
        parameter: 'TEMPERATURE',
        value: 23.5,
        threshold: 22.0,
        message: 'Temperature exceeds safe threshold in Bassin Principal A1',
        isRead: false,
        isResolved: false,
      },
      {
        pondId: pond3.id,
        farmId: farm2.id,
        userId: farmer2.id,
        type: 'WATER_QUALITY',
        severity: 'MEDIUM',
        parameter: 'PH',
        value: 6.8,
        threshold: 7.0,
        message: 'pH level below optimal range in Étang Principal C1',
        isRead: true,
        isResolved: false,
      },
      {
        pondId: pond2.id,
        farmId: farm1.id,
        userId: farmer1.id,
        type: 'MAINTENANCE_DUE',
        severity: 'LOW',
        message: 'Routine filter maintenance due for Bassin Reproduction B1',
        isRead: true,
        isResolved: true,
        resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ],
  });

  console.log('✅ Sample alerts created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📧 Demo accounts created:');
  console.log('👤 Admin: admin@aquaculture.dz / demo123');
  console.log('👤 Farmer 1: farmer1@aquaculture.dz / demo123');
  console.log('👤 Farmer 2: farmer2@aquaculture.dz / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
