import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.MYSQL_URL;
  const parsedUrl = databaseUrl ? new URL(databaseUrl) : null;
  const databaseNameFromUrl = parsedUrl?.pathname.replace(/^\//, "") ?? "";
  const hostFromUrl = parsedUrl?.hostname ?? "";
  const portFromUrl = parsedUrl?.port ?? "";
  const userFromUrl = parsedUrl?.username ?? "";
  const passwordFromUrl = parsedUrl?.password ?? "";
  const preferUrlConfig = Boolean(parsedUrl);

  const adapter = new PrismaMariaDb({
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
