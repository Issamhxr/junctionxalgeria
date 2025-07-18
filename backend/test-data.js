const { PrismaClient } = require('@prisma/client');

async function getTestData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 JUNCTIONX ALGERIA - AQUACULTURE API TEST DATA');
    console.log('================================================');
    
    // Get users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    });
    
    // Get farms
    const farms = await prisma.farm.findMany({
      select: { id: true, name: true }
    });
    
    // Get ponds
    const ponds = await prisma.pond.findMany({
      select: { id: true, name: true, farmId: true },
      take: 5
    });
    
    // Get alerts
    const alerts = await prisma.alert.findMany({
      select: { id: true, message: true, severity: true },
      take: 3
    });
    
    console.log('\n🔐 DEMO ACCOUNTS (email/password):');
    users.forEach(user => {
      console.log(`  ${user.email} / demo123 (${user.role})`);
      console.log(`    ID: ${user.id}`);
    });
    
    console.log('\n🏢 FARMS:');
    farms.forEach(farm => {
      console.log(`  ${farm.name}`);
      console.log(`    ID: ${farm.id}`);
    });
    
    console.log('\n🏊 PONDS (use these IDs in Postman):');
    ponds.forEach(pond => {
      console.log(`  ${pond.name}`);
      console.log(`    Pond ID: ${pond.id}`);
      console.log(`    Farm ID: ${pond.farmId}`);
    });
    
    console.log('\n🚨 SAMPLE ALERTS:');
    alerts.forEach(alert => {
      console.log(`  ${alert.message} (${alert.severity})`);
      console.log(`    Alert ID: ${alert.id}`);
    });
    
    console.log('\n🌐 API BASE URL: http://localhost:5000/api');
    console.log('\n✅ Copy these IDs to use in your Postman requests!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTestData();
