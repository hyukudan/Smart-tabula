import { PrismaClient } from "@prisma/client";
import { getDatabaseType, databaseInfo } from "./db";

/**
 * Prisma Client for Prisma 7 with Multi-Database Support
 *
 * Supported databases:
 * - SQLite (default): file:./dev.db
 * - PostgreSQL: postgresql://user:pass@host:5432/db
 *
 * Configure via DATABASE_URL in .env
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPromise: Promise<PrismaClient> | undefined;
};

async function createAdapter() {
  const dbType = getDatabaseType();
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  if (dbType === "postgresql") {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: dbUrl });
    return new PrismaPg(pool);
  }

  // Default: SQLite
  const { PrismaBetterSQLite3 } = await import("@prisma/adapter-better-sqlite3");
  const Database = (await import("better-sqlite3")).default;
  const path = await import("path");

  const filePath = dbUrl.replace(/^file:/, "");
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const db = new Database(absolutePath);
  return new PrismaBetterSQLite3(db);
}

/**
 * Get the Prisma client instance
 * Must be awaited on first call to initialize the database connection
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = createAdapter().then((adapter) => {
      const client = new PrismaClient({ adapter });
      globalForPrisma.prisma = client;

      if (process.env.NODE_ENV === "development") {
        console.log(`[DB] Connected: ${databaseInfo.type}`);
      }

      return client;
    });
  }

  return globalForPrisma.prismaPromise;
}

// Legacy export for backward compatibility
// NOTE: This is a placeholder that will be replaced on first getPrisma() call
// Always use getPrisma() for guaranteed initialization
export const prisma = {} as PrismaClient;
export default prisma;
