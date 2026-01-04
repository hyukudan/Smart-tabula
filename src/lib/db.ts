/**
 * Database Configuration
 *
 * Smart Tabula supports multiple databases:
 * - SQLite (default): file:./dev.db or file:/path/to/db.sqlite
 * - PostgreSQL: postgresql://user:password@host:5432/database
 * - MySQL: mysql://user:password@host:3306/database
 *
 * Set DATABASE_URL in your .env file to configure.
 */

import { PrismaClient } from "@prisma/client";

export type DatabaseType = "sqlite" | "postgresql" | "mysql";

/**
 * Detects the database type from the connection URL
 */
export function getDatabaseType(url?: string): DatabaseType {
  const dbUrl = url || process.env.DATABASE_URL || "";

  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    return "postgresql";
  }

  if (dbUrl.startsWith("mysql://")) {
    return "mysql";
  }

  // Default to SQLite (file: prefix or no prefix)
  return "sqlite";
}

/**
 * Creates a Prisma adapter based on the database type
 */
export async function createPrismaAdapter(dbType: DatabaseType) {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  switch (dbType) {
    case "postgresql": {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: dbUrl });
      return new PrismaPg(pool);
    }

    case "sqlite": {
      const { PrismaBetterSQLite3 } = await import("@prisma/adapter-better-sqlite3");
      const Database = (await import("better-sqlite3")).default;
      const path = await import("path");

      // Extract file path from URL (remove "file:" prefix)
      const filePath = dbUrl.replace(/^file:/, "");
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);

      const db = new Database(absolutePath);
      return new PrismaBetterSQLite3(db);
    }

    case "mysql": {
      // MySQL adapter not yet available in Prisma 7
      // Fall back to direct connection (no adapter needed for some setups)
      throw new Error(
        "MySQL is not yet fully supported with Prisma 7 adapters. " +
        "Please use PostgreSQL or SQLite for now, or wait for the official MySQL adapter."
      );
    }

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

/**
 * Creates a configured PrismaClient instance
 */
export async function createPrismaClient(): Promise<PrismaClient> {
  const dbType = getDatabaseType();
  const adapter = await createPrismaAdapter(dbType);

  return new PrismaClient({ adapter });
}

// Export database info for logging/debugging
export const databaseInfo = {
  type: getDatabaseType(),
  url: process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, "//***:***@") || "file:./dev.db", // Mask credentials
};
