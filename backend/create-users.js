const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createUsers() {
  console.log("🌱 Creating demo users...");

  try {
    // Check if users already exist
    const existingUsers = await prisma.user.findMany();
    if (existingUsers.length > 0) {
      console.log("✅ Users already exist:");
      existingUsers.forEach((user) => {
        console.log(`- ${user.email} (${user.role})`);
      });
      return;
    }

    // Create demo users
    const hashedPassword = await bcrypt.hash("demo123", 12);

    const admin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@aquaculture.dz",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      },
    });

    const farmer1 = await prisma.user.create({
      data: {
        username: "farmer1",
        email: "farmer1@aquaculture.dz",
        password: hashedPassword,
        firstName: "Ahmed",
        lastName: "Benali",
        role: "FARMER",
      },
    });

    const farmer2 = await prisma.user.create({
      data: {
        username: "farmer2",
        email: "farmer2@aquaculture.dz",
        password: hashedPassword,
        firstName: "Fatima",
        lastName: "Benaissa",
        role: "FARMER",
      },
    });

    console.log("✅ Demo users created successfully!");
    console.log("\n📧 Demo accounts:");
    console.log("👤 Admin: admin@aquaculture.dz / demo123");
    console.log("👤 Farmer 1: farmer1@aquaculture.dz / demo123");
    console.log("👤 Farmer 2: farmer2@aquaculture.dz / demo123");
  } catch (error) {
    console.error("❌ Error creating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
