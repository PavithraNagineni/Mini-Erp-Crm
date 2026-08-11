import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@erp.test" },
      update: {},
      create: { name: "Ava Admin", email: "admin@erp.test", passwordHash, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@erp.test" },
      update: {},
      create: { name: "Sam Sales", email: "sales@erp.test", passwordHash, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@erp.test" },
      update: {},
      create: { name: "Wes Warehouse", email: "warehouse@erp.test", passwordHash, role: "WAREHOUSE" },
    }),
    prisma.user.upsert({
      where: { email: "accounts@erp.test" },
      update: {},
      create: { name: "Amy Accounts", email: "accounts@erp.test", passwordHash, role: "ACCOUNTS" },
    }),
  ]);

  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "Rajesh Traders",
      mobile: "9876543210",
      email: "rajesh@traders.example",
      businessName: "Rajesh Traders Pvt Ltd",
      gstNumber: "24AAAAA0000A1Z5",
      customerType: "WHOLESALE",
      address: "Ring Road, Vadodara, Gujarat",
      status: "ACTIVE",
    },
  });

  const product1 = await prisma.product.upsert({
    where: { sku: "SKU-001" },
    update: {},
    create: {
      name: "Steel Bolt 10mm",
      sku: "SKU-001",
      category: "Hardware",
      unitPrice: 5.5,
      currentStock: 500,
      minStockAlert: 50,
      location: "Warehouse A - Rack 3",
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: "SKU-002" },
    update: {},
    create: {
      name: "PVC Pipe 2 inch (per meter)",
      sku: "SKU-002",
      category: "Plumbing",
      unitPrice: 120,
      currentStock: 20,
      minStockAlert: 25,
      location: "Warehouse A - Rack 7",
    },
  });

  await prisma.customerNote.create({
    data: {
      customerId: customer.id,
      note: "Initial call done. Interested in bulk hardware order next month.",
      createdById: sales.id,
    },
  });

  console.log("Seed complete.");
  console.log("---------------------------------------------");
  console.log("Test login credentials (all use password: Password123!)");
  console.log(`ADMIN     -> ${admin.email}`);
  console.log(`SALES     -> ${sales.email}`);
  console.log(`WAREHOUSE -> ${warehouse.email}`);
  console.log(`ACCOUNTS  -> ${accounts.email}`);
  console.log("---------------------------------------------");
  console.log(`Sample customer: ${customer.name} (${customer.id})`);
  console.log(`Sample products: ${product1.sku}, ${product2.sku}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
