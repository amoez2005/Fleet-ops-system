import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  Prisma,
  Role,
  AssetStatus,
  ClientStatus,
  AssignmentStatus,
  InvoiceStatus,
} from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL;
  const parsedUrl = databaseUrl ? new URL(databaseUrl) : null;
  const databaseNameFromUrl = parsedUrl?.pathname.replace(/^\//, "") ?? "";
  const hostFromUrl = parsedUrl?.hostname ?? "";
  const portFromUrl = parsedUrl?.port ?? "";
  const userFromUrl = parsedUrl?.username ?? "";
  const passwordFromUrl = parsedUrl?.password ?? "";
  const preferUrlConfig = Boolean(parsedUrl);

  return {
    host:
      (preferUrlConfig ? hostFromUrl : undefined) ??
      process.env.DATABASE_HOST ??
      process.env.MYSQLHOST ??
      hostFromUrl,
    port: Number(
      (preferUrlConfig ? portFromUrl : undefined) ??
        process.env.DATABASE_PORT ??
        process.env.MYSQLPORT ??
        portFromUrl ??
        3306
    ),
    user:
      (preferUrlConfig ? userFromUrl : undefined) ??
      process.env.DATABASE_USER ??
      process.env.MYSQLUSER ??
      userFromUrl,
    password:
      (preferUrlConfig ? passwordFromUrl : undefined) ??
      process.env.DATABASE_PASSWORD ??
      process.env.MYSQLPASSWORD ??
      passwordFromUrl,
    database:
      (preferUrlConfig ? databaseNameFromUrl : undefined) ??
      process.env.DATABASE_NAME ??
      process.env.MYSQLDATABASE ??
      databaseNameFromUrl,
  };
}

const databaseConfig = getDatabaseConfig();

const adapter = new PrismaMariaDb({
  host: databaseConfig.host,
  port: databaseConfig.port,
  user: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
  allowPublicKeyRetrieval: true,
  connectionLimit: 20,
  acquireTimeout: 30000,
  connectTimeout: 5000,
  idleTimeout: 300,
});

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin12345!", 10);
  const demoPassword = "Demo12345!";
  const demoPasswordHash = await bcrypt.hash(demoPassword, 10);
  const demoUsers = [
    {
      name: "Ava Holloway",
      email: "ava.holloway@landsea.local",
      role: Role.SUPER_ADMIN,
    },
    {
      name: "Noah Mercer",
      email: "noah.mercer@landsea.local",
      role: Role.OPERATIONS_MANAGER,
    },
    {
      name: "Leah Bennett",
      email: "leah.bennett@landsea.local",
      role: Role.FINANCE_MANAGER,
    },
    {
      name: "Omar Rahman",
      email: "omar.rahman@landsea.local",
      role: Role.HR_ADMIN,
    },
    {
      name: "Mila Carter",
      email: "mila.carter@landsea.local",
      role: Role.READ_ONLY,
    },
  ];

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@landsea.local" },
    update: {
      name: "Super Admin",
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      name: "Super Admin",
      email: "admin@landsea.local",
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  for (const demoUser of demoUsers) {
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        name: demoUser.name,
        passwordHash: demoPasswordHash,
        role: demoUser.role,
        isActive: true,
      },
      create: {
        name: demoUser.name,
        email: demoUser.email,
        passwordHash: demoPasswordHash,
        role: demoUser.role,
        isActive: true,
      },
    });
  }

  await prisma.category.createMany({
    data: [
      { name: "Mobile Crane", description: "Heavy lifting crane units" },
      { name: "Trailer", description: "Trailer transport units" },
      { name: "Hiab", description: "Hiab loader crane units" },
      { name: "Truck", description: "General truck fleet units" },
      { name: "Other", description: "Other equipment and vehicles" },
    ],
    skipDuplicates: true,
  });

  const truckCategory = await prisma.category.findUnique({
    where: { name: "Truck" },
  });

  if (!truckCategory) {
    throw new Error("Truck category not found after seed.");
  }

  const asset = await prisma.asset.upsert({
    where: { assetCode: "TR-001" },
    update: {
      registrationNo: "ABC-1234",
      brand: "Volvo",
      model: "FH",
      specification: "Heavy duty truck",
      ownershipStatus: "Owned",
      operationalStatus: AssetStatus.AVAILABLE,
      notes: "Seeded demo asset",
      categoryId: truckCategory.id,
    },
    create: {
      assetCode: "TR-001",
      registrationNo: "ABC-1234",
      brand: "Volvo",
      model: "FH",
      specification: "Heavy duty truck",
      ownershipStatus: "Owned",
      operationalStatus: AssetStatus.AVAILABLE,
      notes: "Seeded demo asset",
      categoryId: truckCategory.id,
    },
  });

  const client = await prisma.client.upsert({
    where: { clientCode: "CL-001" },
    update: {
      companyName: "ABC Construction Ltd.",
      contactPerson: "Operations Supervisor",
      phone: "+92-300-0000000",
      email: "ops@abcconstruction.com",
      address: "Lahore",
      contractNotes: "Standard daily hire agreement",
      invoiceTerms: "30 days",
      status: ClientStatus.ACTIVE,
    },
    create: {
      clientCode: "CL-001",
      companyName: "ABC Construction Ltd.",
      contactPerson: "Operations Supervisor",
      phone: "+92-300-0000000",
      email: "ops@abcconstruction.com",
      address: "Lahore",
      contractNotes: "Standard daily hire agreement",
      invoiceTerms: "30 days",
      status: ClientStatus.ACTIVE,
    },
  });

  let assignment = await prisma.assignment.findFirst({
    where: {
      clientId: client.id,
      title: "Truck Hire - Site A",
    },
  });

  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        title: "Truck Hire - Site A",
        startDate: new Date("2026-04-01T08:00:00.000Z"),
        endDate: new Date("2026-04-03T17:00:00.000Z"),
        location: "Site A",
        rateType: "Per day",
        rateValue: 50000,
        jobNotes: "Initial seeded assignment",
        status: AssignmentStatus.COMPLETED,
        clientId: client.id,
      },
    });
  }

  const existingAssignmentAsset = await prisma.assignmentAsset.findFirst({
    where: {
      assignmentId: assignment.id,
      assetId: asset.id,
    },
  });

  if (!existingAssignmentAsset) {
    await prisma.assignmentAsset.create({
      data: {
        assignmentId: assignment.id,
        assetId: asset.id,
      },
    });
  }

  const existingRevenue = await prisma.revenue.findFirst({
    where: {
      assignmentId: assignment.id,
      revenueCategory: "Transport",
    },
  });

  if (!existingRevenue) {
    await prisma.revenue.create({
      data: {
        grossAmount: 150000,
        deductions: 10000,
        netAmount: 140000,
        revenueDate: new Date("2026-04-03T18:00:00.000Z"),
        revenueCategory: "Transport",
        notes: "Seeded revenue entry",
        assignmentId: assignment.id,
      },
    });
  }

  const existingSalary = await prisma.salaryRecord.findFirst({
    where: {
      employeeName: "Operations Supervisor",
    },
  });

  if (!existingSalary) {
    await prisma.salaryRecord.create({
      data: {
        employeeName: "Operations Supervisor",
        roleTitle: "Operations Manager",
        salaryMonth: new Date("2026-04-01T00:00:00.000Z"),
        amount: 85000,
        paymentDate: new Date("2026-04-05T00:00:00.000Z"),
        notes: "Seeded salary record",
      },
    });
  }

  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNo: "INV-2026-0001" },
  });

  let invoice = existingInvoice;

  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        invoiceNo: "INV-2026-0001",
        issueDate: new Date("2026-04-04T00:00:00.000Z"),
        dueDate: new Date("2026-05-04T00:00:00.000Z"),
        subtotal: 140000,
        taxAmount: 0,
        totalAmount: 140000,
        status: InvoiceStatus.SENT,
        notes: "Seeded invoice",
        clientId: client.id,
      },
    });
  }

  const existingInvoiceAssignment = await prisma.invoiceAssignment.findFirst({
    where: {
      invoiceId: invoice.id,
      assignmentId: assignment.id,
    },
  });

  if (!existingInvoiceAssignment) {
    await prisma.invoiceAssignment.create({
      data: {
        invoiceId: invoice.id,
        assignmentId: assignment.id,
      },
    });
  }

  const existingMaintenance = await prisma.maintenanceRecord.findFirst({
    where: {
      assetId: asset.id,
      serviceType: "Oil Change",
    },
  });

  if (!existingMaintenance) {
    await prisma.maintenanceRecord.create({
      data: {
        serviceType: "Oil Change",
        lastServiceDate: new Date("2026-03-20T00:00:00.000Z"),
        nextDueDate: new Date("2026-05-20T00:00:00.000Z"),
        cost: 12000,
        vendor: "City Workshop",
        notes: "Seeded maintenance record",
        assetId: asset.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "SEED",
      entityType: "SYSTEM",
      entityId: adminUser.id,
      beforeJson: Prisma.DbNull,
      afterJson: {
        message: "Initial seed data inserted",
      },
      userId: adminUser.id,
    },
  });

  console.log("Seed completed successfully.");
  console.log("Admin login:");
  console.log("Email: admin@landsea.local");
  console.log("Password: Admin12345!");
  console.log("Demo user password:");
  console.log(`Password: ${demoPassword}`);
  console.log("Demo users:");
  for (const demoUser of demoUsers) {
    console.log(`${demoUser.role}: ${demoUser.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
