import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL;
  const parsedUrl = databaseUrl ? new URL(databaseUrl) : null;
  const databaseNameFromUrl = parsedUrl?.pathname.replace(/^\//, "") ?? "";

  const adapter = new PrismaMariaDb({
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
    allowPublicKeyRetrieval: true,
    connectionLimit: 20,
    acquireTimeout: 30000,
    connectTimeout: 5000,
    idleTimeout: 300,
  });

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
