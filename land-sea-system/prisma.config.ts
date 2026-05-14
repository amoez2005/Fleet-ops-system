import { defineConfig } from "prisma/config";

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME,
  } = process.env;

  if (
    !DATABASE_HOST ||
    !DATABASE_PORT ||
    !DATABASE_USER ||
    !DATABASE_PASSWORD ||
    !DATABASE_NAME
  ) {
    // Return a dummy URL for build-time operations like prisma generate,
    // which only need the schema and do not connect to the database.
    return "mysql://build:build@localhost:3306/placeholder";
  }

  return `mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
