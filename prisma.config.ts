import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 configuration
// Supports: SQLite (default), PostgreSQL, MySQL
export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
});
