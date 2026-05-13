import "dotenv/config";
import {
  AssetStatus,
  AssignmentStatus,
  ClientStatus,
  InvoiceStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL;
  const parsedUrl = databaseUrl ? new URL(databaseUrl) : null;
  const databaseNameFromUrl = parsedUrl?.pathname.replace(/^\//, "") ?? "";

  return {
    host:
      process.env.DATABASE_HOST ??
      process.env.MYSQLHOST ??
      parsedUrl?.hostname ??
      "",
    port: Number(
      process.env.DATABASE_PORT ??
        process.env.MYSQLPORT ??
        parsedUrl?.port ??
        3306
    ),
    user:
      process.env.DATABASE_USER ??
      process.env.MYSQLUSER ??
      parsedUrl?.username ??
      "",
    password:
      process.env.DATABASE_PASSWORD ??
      process.env.MYSQLPASSWORD ??
      parsedUrl?.password ??
      "",
    database:
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

const MARKER = "[bulk-demo]";
const COUNTS = {
  clients: 40,
  assets: 120,
  assignments: 180,
  invoices: 90,
  maintenance: 96,
};

const categorySeeds = [
  { name: "Mobile Crane", description: "Heavy lifting crane units" },
  { name: "Trailer", description: "Trailer transport units" },
  { name: "Hiab", description: "Hiab loader crane units" },
  { name: "Truck", description: "General truck fleet units" },
  { name: "Other", description: "Other equipment and vehicles" },
  { name: "Forklift", description: "Warehouse and yard handling units" },
  { name: "Service Van", description: "Maintenance and site service vans" },
  { name: "Excavator", description: "Earthmoving equipment" },
];

const clientPrefixes = [
  "North",
  "Summit",
  "Harbor",
  "Atlas",
  "Bluewave",
  "Cedar",
  "Delta",
  "Evergreen",
  "Frontier",
  "Granite",
];

const clientNouns = [
  "Logistics",
  "Infrastructure",
  "Marine",
  "Construction",
  "Industrial",
  "Freight",
  "Projects",
  "Transport",
  "Engineering",
  "Holdings",
];

const clientSuffixes = ["Ltd.", "Group", "Partners", "Services", "Co."];

const firstNames = [
  "Mason",
  "Olivia",
  "Ethan",
  "Sophia",
  "Liam",
  "Aisha",
  "Daniel",
  "Hannah",
  "Isaac",
  "Mariam",
  "Jonah",
  "Layla",
];

const lastNames = [
  "Walker",
  "Rahman",
  "Iqbal",
  "Mercer",
  "Bennett",
  "Khan",
  "Coleman",
  "Sharif",
  "Harper",
  "Dawson",
];

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Multan",
  "Faisalabad",
  "Port Qasim",
  "Gwadar",
];

const assetBrands: Record<string, string[]> = {
  "Mobile Crane": ["Liebherr", "Tadano", "Grove"],
  Trailer: ["Schmitz", "CIMC", "Krone"],
  Hiab: ["Hiab", "Palfinger", "Fassi"],
  Truck: ["Volvo", "Scania", "MAN", "Mercedes-Benz"],
  Other: ["Komatsu", "Hitachi", "JCB"],
  Forklift: ["Toyota", "Hyster", "Doosan"],
  "Service Van": ["Toyota", "Ford", "Hyundai"],
  Excavator: ["Caterpillar", "Hyundai", "Hitachi"],
};

const assetModels: Record<string, string[]> = {
  "Mobile Crane": ["LTM 1050", "ATF 60", "GMK 3060"],
  Trailer: ["Dry Van 45", "Flatbed 40", "Low Bed 50"],
  Hiab: ["X-HiPro 232", "PK 27001", "F245"],
  Truck: ["FH", "R450", "TGX", "Actros"],
  Other: ["Utility Carrier", "Loader Unit", "Support Rig"],
  Forklift: ["8FGCU25", "H3.0FT", "D30S"],
  "Service Van": ["Hiace", "Transit", "H-100"],
  Excavator: ["320D", "R220LC", "ZX210"],
};

const assignmentTitles = [
  "Port Transfer",
  "Site Mobilization",
  "Heavy Lift Support",
  "Material Haulage",
  "Equipment Deployment",
  "Yard Handling",
  "Fuel Delivery Support",
  "Workshop Relocation",
];

const serviceTypes = [
  "Oil Change",
  "Hydraulic Inspection",
  "Brake Service",
  "Tire Replacement",
  "Annual Preventive Service",
  "Electrical Repair",
  "Filter Replacement",
  "Cooling System Flush",
];

const maintenanceVendors = [
  "City Workshop",
  "Harbor Mechanics",
  "Prime Fleet Care",
  "Delta Service Hub",
  "Northline Garage",
];

const revenueCategories = [
  "Transport",
  "Equipment Hire",
  "Labour",
  "Maintenance Recovery",
  "Other",
];

const payrollEmployees = [
  { employeeName: "Adnan Malik", roleTitle: "Dispatcher", baseAmount: 62000 },
  { employeeName: "Sara Waseem", roleTitle: "Accountant", baseAmount: 76000 },
  { employeeName: "Bilal Hassan", roleTitle: "Fleet Supervisor", baseAmount: 91000 },
  { employeeName: "Nadia Javed", roleTitle: "HR Officer", baseAmount: 68000 },
  { employeeName: "Usman Tariq", roleTitle: "Operations Lead", baseAmount: 98000 },
  { employeeName: "Hira Saeed", roleTitle: "Payroll Analyst", baseAmount: 70000 },
  { employeeName: "Kamran Ali", roleTitle: "Workshop Manager", baseAmount: 88000 },
  { employeeName: "Mina Yusuf", roleTitle: "Admin Coordinator", baseAmount: 59000 },
];

async function main() {
  await ensureCategories();
  await cleanupPreviousBulkData();

  const categories = await prisma.category.findMany({
    where: {
      name: {
        in: categorySeeds.map((category) => category.name),
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  await createClients();
  const clients = await prisma.client.findMany({
    where: {
      clientCode: {
        startsWith: "TST-CL-",
      },
    },
    orderBy: {
      clientCode: "asc",
    },
  });

  await createAssets(categories);
  const assets = await prisma.asset.findMany({
    where: {
      assetCode: {
        startsWith: "TST-AS-",
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      assetCode: "asc",
    },
  });

  const assignmentDetails = await createAssignments(clients, assets);
  await createRevenues(assignmentDetails);
  await createInvoices(clients, assignmentDetails);
  await createMaintenanceRecords(assets);
  await createSalaryRecords();

  const [clientCount, assetCount, assignmentCount, revenueCount, invoiceCount, maintenanceCount, salaryCount] =
    await Promise.all([
      prisma.client.count({
        where: {
          clientCode: {
            startsWith: "TST-CL-",
          },
        },
      }),
      prisma.asset.count({
        where: {
          assetCode: {
            startsWith: "TST-AS-",
          },
        },
      }),
      prisma.assignment.count({
        where: {
          title: {
            startsWith: `${MARKER} `,
          },
        },
      }),
      prisma.revenue.count({
        where: {
          notes: {
            contains: MARKER,
          },
        },
      }),
      prisma.invoice.count({
        where: {
          invoiceNo: {
            startsWith: "TST-INV-",
          },
        },
      }),
      prisma.maintenanceRecord.count({
        where: {
          notes: {
            contains: MARKER,
          },
        },
      }),
      prisma.salaryRecord.count({
        where: {
          notes: {
            contains: MARKER,
          },
        },
      }),
    ]);

  console.log("Bulk demo data loaded successfully.");
  console.log(`Clients: ${clientCount}`);
  console.log(`Assets: ${assetCount}`);
  console.log(`Assignments: ${assignmentCount}`);
  console.log(`Revenues: ${revenueCount}`);
  console.log(`Invoices: ${invoiceCount}`);
  console.log(`Maintenance records: ${maintenanceCount}`);
  console.log(`Salary records: ${salaryCount}`);
}

async function ensureCategories() {
  await prisma.category.createMany({
    data: categorySeeds,
    skipDuplicates: true,
  });
}

async function cleanupPreviousBulkData() {
  const [testClients, testAssets, testAssignments, testInvoices] = await Promise.all([
    prisma.client.findMany({
      where: {
        clientCode: {
          startsWith: "TST-CL-",
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.asset.findMany({
      where: {
        assetCode: {
          startsWith: "TST-AS-",
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.assignment.findMany({
      where: {
        title: {
          startsWith: `${MARKER} `,
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        invoiceNo: {
          startsWith: "TST-INV-",
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  const clientIds = testClients.map((item) => item.id);
  const assetIds = testAssets.map((item) => item.id);
  const assignmentIds = testAssignments.map((item) => item.id);
  const invoiceIds = testInvoices.map((item) => item.id);

  if (invoiceIds.length > 0 || assignmentIds.length > 0) {
    await prisma.invoiceAssignment.deleteMany({
      where: {
        OR: [
          invoiceIds.length > 0 ? { invoiceId: { in: invoiceIds } } : undefined,
          assignmentIds.length > 0 ? { assignmentId: { in: assignmentIds } } : undefined,
        ].filter(Boolean) as Prisma.InvoiceAssignmentWhereInput[],
      },
    });
  }

  if (assignmentIds.length > 0 || assetIds.length > 0) {
    await prisma.assignmentAsset.deleteMany({
      where: {
        OR: [
          assignmentIds.length > 0 ? { assignmentId: { in: assignmentIds } } : undefined,
          assetIds.length > 0 ? { assetId: { in: assetIds } } : undefined,
        ].filter(Boolean) as Prisma.AssignmentAssetWhereInput[],
      },
    });
  }

  if (assignmentIds.length > 0) {
    await prisma.revenue.deleteMany({
      where: {
        assignmentId: {
          in: assignmentIds,
        },
      },
    });

    await prisma.assignment.deleteMany({
      where: {
        id: {
          in: assignmentIds,
        },
      },
    });
  }

  if (invoiceIds.length > 0) {
    await prisma.invoice.deleteMany({
      where: {
        id: {
          in: invoiceIds,
        },
      },
    });
  }

  if (assetIds.length > 0) {
    await prisma.maintenanceRecord.deleteMany({
      where: {
        assetId: {
          in: assetIds,
        },
      },
    });

    await prisma.asset.deleteMany({
      where: {
        id: {
          in: assetIds,
        },
      },
    });
  }

  if (clientIds.length > 0) {
    await prisma.client.deleteMany({
      where: {
        id: {
          in: clientIds,
        },
      },
    });
  }

  await prisma.salaryRecord.deleteMany({
    where: {
      notes: {
        contains: MARKER,
      },
    },
  });

  await prisma.auditLog.deleteMany({
    where: {
      entityType: "BULK_TEST_DATA",
    },
  });
}

async function createClients() {
  const data = Array.from({ length: COUNTS.clients }, (_, index) => {
    const companyName = `${clientPrefixes[index % clientPrefixes.length]} ${clientNouns[(index * 3) % clientNouns.length]} ${clientSuffixes[index % clientSuffixes.length]}`;
    const contactFirstName = firstNames[index % firstNames.length];
    const contactLastName = lastNames[(index * 2) % lastNames.length];
    const city = cities[index % cities.length];
    const statusCycle = [ClientStatus.ACTIVE, ClientStatus.ACTIVE, ClientStatus.ACTIVE, ClientStatus.HOLD, ClientStatus.INACTIVE];

    return {
      clientCode: `TST-CL-${pad(index + 1, 3)}`,
      companyName,
      contactPerson: `${contactFirstName} ${contactLastName}`,
      phone: `+92-300-${pad(1000000 + index * 173, 7)}`,
      email: `client${pad(index + 1, 3)}@bulk.landsea.local`,
      address: `${city} Industrial Area, Yard ${index + 1}`,
      contractNotes: `${MARKER} Demo client contract profile`,
      invoiceTerms: index % 3 === 0 ? "15 days" : index % 3 === 1 ? "30 days" : "45 days",
      status: statusCycle[index % statusCycle.length],
    };
  });

  await prisma.client.createMany({
    data,
  });
}

async function createAssets(categories: Array<{ id: string; name: string }>) {
  const data = Array.from({ length: COUNTS.assets }, (_, index) => {
    const category = categories[index % categories.length];
    const brandList = assetBrands[category.name] ?? assetBrands.Other;
    const modelList = assetModels[category.name] ?? assetModels.Other;
    const statusCycle = [
      AssetStatus.AVAILABLE,
      AssetStatus.AVAILABLE,
      AssetStatus.ACTIVE,
      AssetStatus.ACTIVE,
      AssetStatus.MAINTENANCE,
      AssetStatus.INACTIVE,
    ];

    return {
      assetCode: `TST-AS-${pad(index + 1, 4)}`,
      registrationNo: `TST-${pad(index + 1, 4)}`,
      brand: brandList[index % brandList.length],
      model: modelList[(index * 2) % modelList.length],
      specification: `${category.name} unit for ${index % 2 === 0 ? "project cargo" : "daily field operations"}`,
      ownershipStatus: index % 4 === 0 ? "Leased" : "Owned",
      operationalStatus: statusCycle[index % statusCycle.length],
      notes: `${MARKER} Demo asset`,
      categoryId: category.id,
    };
  });

  await prisma.asset.createMany({
    data,
  });
}

async function createAssignments(
  clients: Array<{ id: string; companyName: string }>,
  assets: Array<{ id: string; assetCode: string }>
) {
  const details: AssignmentDetail[] = [];
  const baseDate = new Date("2025-01-01T08:00:00.000Z");

  for (let index = 0; index < COUNTS.assignments; index += 1) {
    const client = clients[index % clients.length];
    const titleBase = assignmentTitles[index % assignmentTitles.length];
    const status = getAssignmentStatus(index);
    const startDate = addDays(baseDate, index * 2);
    const endDate =
      status === AssignmentStatus.COMPLETED
        ? addDays(startDate, 1 + (index % 6))
        : status === AssignmentStatus.ACTIVE
          ? addDays(startDate, 5 + (index % 8))
          : status === AssignmentStatus.CANCELLED
            ? addDays(startDate, 1)
            : null;
    const assetCount = index % 5 === 0 ? 2 : 1;
    const linkedAssets = takeUniqueAssets(assets, index, assetCount);
    const rateValue = 35000 + (index % 9) * 6000;

    const assignment = await prisma.assignment.create({
      data: {
        title: `${MARKER} ${titleBase} ${pad(index + 1, 3)}`,
        startDate,
        endDate,
        location: `${cities[index % cities.length]} Site ${1 + (index % 12)}`,
        rateType: index % 4 === 0 ? "Per trip" : index % 4 === 1 ? "Per day" : index % 4 === 2 ? "Per shift" : "Fixed",
        rateValue,
        jobNotes: `${MARKER} Assignment for ${client.companyName}`,
        status,
        clientId: client.id,
        assets: {
          create: linkedAssets.map((asset) => ({
            assetId: asset.id,
          })),
        },
      },
    });

    details.push({
      id: assignment.id,
      clientId: client.id,
      status,
      title: assignment.title ?? "",
      startDate,
      endDate,
      linkedAssetIds: linkedAssets.map((asset) => asset.id),
      revenueTotal: 0,
      revenueDates: [],
    });
  }

  return details;
}

async function createRevenues(assignmentDetails: AssignmentDetail[]) {
  for (let index = 0; index < assignmentDetails.length; index += 1) {
    const assignment = assignmentDetails[index];

    if (assignment.status === AssignmentStatus.CANCELLED) {
      continue;
    }

    const revenueEntryCount =
      assignment.status === AssignmentStatus.COMPLETED
        ? index % 3 === 0
          ? 2
          : 1
        : 1;

    for (let revenueIndex = 0; revenueIndex < revenueEntryCount; revenueIndex += 1) {
      const grossAmount = 78000 + ((index + revenueIndex) % 12) * 13500;
      const deductions = (index + revenueIndex) % 4 === 0 ? 7000 : (index + revenueIndex) % 4 === 1 ? 4500 : 2500;
      const netAmount = grossAmount - deductions;
      const revenueDate = addDays(
        assignment.endDate ?? assignment.startDate,
        1 + revenueIndex
      );

      await prisma.revenue.create({
        data: {
          grossAmount,
          deductions,
          netAmount,
          revenueDate,
          revenueCategory: revenueCategories[(index + revenueIndex) % revenueCategories.length],
          notes: `${MARKER} Revenue for ${assignment.title}`,
          assignmentId: assignment.id,
        },
      });

      assignment.revenueTotal += netAmount;
      assignment.revenueDates.push(revenueDate);
    }
  }
}

async function createInvoices(
  clients: Array<{ id: string }>,
  assignmentDetails: AssignmentDetail[]
) {
  const completedByClient = new Map<string, AssignmentDetail[]>();

  for (const assignment of assignmentDetails) {
    if (
      assignment.status !== AssignmentStatus.COMPLETED ||
      assignment.revenueTotal <= 0
    ) {
      continue;
    }

    const bucket = completedByClient.get(assignment.clientId) ?? [];
    bucket.push(assignment);
    completedByClient.set(assignment.clientId, bucket);
  }

  let invoiceIndex = 0;

  for (const client of clients) {
    const assignments = completedByClient.get(client.id) ?? [];

    for (let offset = 0; offset < assignments.length && invoiceIndex < COUNTS.invoices; ) {
      const groupSize = invoiceIndex % 4 === 0 ? 2 : 1;
      const selectedAssignments = assignments.slice(offset, offset + groupSize);

      if (selectedAssignments.length === 0) {
        break;
      }

      const subtotal = selectedAssignments.reduce(
        (sum, assignment) => sum + assignment.revenueTotal,
        0
      );
      const taxAmount = invoiceIndex % 3 === 0 ? Math.round(subtotal * 0.05) : 0;
      const totalAmount = subtotal + taxAmount;
      const issueAnchor = selectedAssignments
        .flatMap((assignment) => assignment.revenueDates)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? new Date();
      const issueDate = addDays(issueAnchor, 3 + (invoiceIndex % 6));
      const dueDate = addDays(issueDate, 15 + (invoiceIndex % 25));
      const status = getInvoiceStatus(invoiceIndex);
      const paymentDate =
        status === InvoiceStatus.PAID ? addDays(issueDate, 5 + (invoiceIndex % 18)) : null;

      await prisma.invoice.create({
        data: {
          invoiceNo: `TST-INV-2026-${pad(invoiceIndex + 1, 4)}`,
          issueDate,
          dueDate,
          subtotal,
          taxAmount,
          totalAmount,
          status,
          paymentDate,
          notes: `${MARKER} Invoice covering ${selectedAssignments.length} assignment(s)`,
          clientId: client.id,
          assignments: {
            create: selectedAssignments.map((assignment) => ({
              assignmentId: assignment.id,
            })),
          },
        },
      });

      invoiceIndex += 1;
      offset += groupSize;
    }

    if (invoiceIndex >= COUNTS.invoices) {
      break;
    }
  }
}

async function createMaintenanceRecords(assets: Array<{ id: string; assetCode: string }>) {
  const baseDate = new Date("2025-02-01T00:00:00.000Z");

  for (let index = 0; index < COUNTS.maintenance; index += 1) {
    const asset = assets[index % assets.length];
    const lastServiceDate = addDays(baseDate, index * 5);

    await prisma.maintenanceRecord.create({
      data: {
        serviceType: serviceTypes[index % serviceTypes.length],
        lastServiceDate,
        nextDueDate: addDays(lastServiceDate, 45 + (index % 50)),
        cost: 6000 + (index % 10) * 1800,
        vendor: maintenanceVendors[index % maintenanceVendors.length],
        notes: `${MARKER} Maintenance for ${asset.assetCode}`,
        assetId: asset.id,
      },
    });
  }
}

async function createSalaryRecords() {
  const monthStarts = Array.from({ length: 12 }, (_, index) =>
    new Date(Date.UTC(2025, index, 1))
  );

  for (const monthStart of monthStarts) {
    for (let employeeIndex = 0; employeeIndex < payrollEmployees.length; employeeIndex += 1) {
      const employee = payrollEmployees[employeeIndex];
      const amount = employee.baseAmount + (employeeIndex % 3) * 4500;

      await prisma.salaryRecord.create({
        data: {
          employeeName: employee.employeeName,
          roleTitle: employee.roleTitle,
          salaryMonth: monthStart,
          amount,
          paymentDate: addDays(monthStart, 27),
          notes: `${MARKER} Payroll batch ${formatMonth(monthStart)}`,
        },
      });
    }
  }
}

function getAssignmentStatus(index: number) {
  if (index % 8 === 0) {
    return AssignmentStatus.CANCELLED;
  }

  if (index % 5 === 0) {
    return AssignmentStatus.ACTIVE;
  }

  if (index % 7 === 0) {
    return AssignmentStatus.PLANNED;
  }

  return AssignmentStatus.COMPLETED;
}

function getInvoiceStatus(index: number) {
  const statuses = [
    InvoiceStatus.PAID,
    InvoiceStatus.SENT,
    InvoiceStatus.DRAFT,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
  ];

  return statuses[index % statuses.length];
}

function takeUniqueAssets<T>(items: T[], offset: number, count: number) {
  const selected: T[] = [];

  for (let index = 0; index < count; index += 1) {
    selected.push(items[(offset * 3 + index * 7) % items.length]);
  }

  return selected.filter((item, index, array) => array.indexOf(item) === index);
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function pad(value: number, length: number) {
  return String(value).padStart(length, "0");
}

function formatMonth(value: Date) {
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${value.getUTCFullYear()}-${month}`;
}

type AssignmentDetail = {
  id: string;
  clientId: string;
  status: AssignmentStatus;
  title: string;
  startDate: Date;
  endDate: Date | null;
  linkedAssetIds: string[];
  revenueTotal: number;
  revenueDates: Date[];
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
