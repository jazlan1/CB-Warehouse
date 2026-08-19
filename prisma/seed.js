/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("./generated/client/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding demo accounts for Warehouse Portal...\n");

  // ==========================================
  // 1. ADMIN USER
  // ==========================================
  const adminEmail = "admin@warehouse.com";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    const adminPassword = await bcrypt.hash("Admin@12345", 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "System Administrator",
        password: adminPassword,
        role: "ADMIN",
        isActivated: true,
        companyName: "Warehouse Core Systems",
      },
    });
    console.log(`✅ Created Admin Demo Account: ${adminEmail} / Admin@12345`);
  } else {
    console.log(`ℹ️ Admin Account already exists: ${adminEmail}`);
  }

  // ==========================================
  // 2. CB WAREHOUSE TEAM USER
  // ==========================================
  const cbEmail = "cb@warehouse.com";
  let cbUser = await prisma.user.findUnique({ where: { email: cbEmail } });

  if (!cbUser) {
    const cbPassword = await bcrypt.hash("Team@12345", 10);
    cbUser = await prisma.user.create({
      data: {
        email: cbEmail,
        name: "Alex Johnson (CB Warehouse)",
        password: cbPassword,
        role: "CB",
        isActivated: true,
        companyName: "CB Warehouse Operations",
        cbProfile: {
          create: {
            name: "Alex Johnson",
            phone: "+1 (555) 234-5678",
            designation: "Warehouse Lead",
            shiftStart: "08:00 AM",
            shiftEnd: "05:00 PM",
          },
        },
      },
    });
    console.log(`✅ Created CB Team Demo Account: ${cbEmail} / Team@12345`);
  } else {
    console.log(`ℹ️ CB Team Account already exists: ${cbEmail}`);
  }

  // ==========================================
  // 3. CLIENT USER
  // ==========================================
  const clientEmail = "client@warehouse.com";
  let clientUser = await prisma.user.findUnique({ where: { email: clientEmail } });

  if (!clientUser) {
    const clientPassword = await bcrypt.hash("Client@12345", 10);
    clientUser = await prisma.user.create({
      data: {
        email: clientEmail,
        name: "Sarah Jenkins",
        password: clientPassword,
        role: "CLIENT",
        isActivated: true,
        companyName: "Acme Global Events",
        clientProfile: {
          create: {
            name: "Sarah Jenkins",
            companyName: "Acme Global Events",
            phone: "+1 (555) 987-6543",
            address: "1000 Congress Ave, Austin, TX 78701",
            notes: "VIP Client - Experian Partner",
          },
        },
      },
    });
    console.log(`✅ Created Client Demo Account: ${clientEmail} / Client@12345`);
  } else {
    console.log(`ℹ️ Client Account already exists: ${clientEmail}`);
  }

  // ==========================================
  // 4. SAMPLE INVENTORY DATA (If empty)
  // ==========================================
  const inventoryCount = await prisma.inventory.count();
  if (inventoryCount === 0 && cbUser && clientUser) {
    console.log("\n📦 Adding sample inventory items...");

    const item1 = await prisma.inventory.create({
      data: {
        name: "4K Event Video Display 65-inch",
        sku: "DISP-4K-65",
        bin: "A-12-04",
        quantity: 15,
        condition: "Excellent",
        description: "Ultra HD HDR display monitor with custom flight road case.",
        stockStatus: "IN_STOCK",
        createdById: cbUser.id,
        clientId: clientUser.id,
      },
    });

    const item2 = await prisma.inventory.create({
      data: {
        name: "Wireless Lavalier Microphone System",
        sku: "AUDIO-LAV-PRO",
        bin: "B-03-01",
        quantity: 28,
        condition: "Good",
        description: "Dual-channel wireless receiver with bodypack transmitters.",
        stockStatus: "IN_STOCK",
        createdById: cbUser.id,
        clientId: clientUser.id,
      },
    });

    const item3 = await prisma.inventory.create({
      data: {
        name: "LED Stage Spotlight 200W",
        sku: "LIGHT-LED-200",
        bin: "C-08-02",
        quantity: 40,
        condition: "Brand New",
        description: "DMX-controllable RGBW LED spotlight with barn doors.",
        stockStatus: "IN_STOCK",
        createdById: cbUser.id,
        clientId: clientUser.id,
      },
    });

    // Sample Order
    await prisma.order.create({
      data: {
        eventName: "Annual Global Partner Summit 2026",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        shipToAddress: "Austin Convention Center, 500 E Cesar Chavez St, Austin, TX",
        returnAddress: "CB Main Warehouse, Dock 4, Dallas, TX",
        specialInstructions: "Handle flight cases with care. Liftgate truck required.",
        status: "APPROVED",
        clientId: clientUser.id,
        items: {
          create: [
            { inventoryId: item1.id, quantity: 2 },
            { inventoryId: item2.id, quantity: 4 },
            { inventoryId: item3.id, quantity: 6 },
          ],
        },
      },
    });

    console.log("✅ Sample inventory and demonstration order created!");
  }

  console.log("\n========================================================");
  console.log("🎉 ALL DEMO LOGINS READY FOR LOCAL TESTING!");
  console.log("========================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
