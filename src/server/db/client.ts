import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let client: PrismaClient | undefined;

export function getDb(): PrismaClient {
  if (client) return client;
  if (globalForPrisma.prisma) return (client = globalForPrisma.prisma);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use postgres:// or postgresql://.");
  }

  const adapter = new PrismaPg(
    { connectionString, max: 5, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000 },
    { schema: url.searchParams.get("schema") || "public" },
  );
  client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}
