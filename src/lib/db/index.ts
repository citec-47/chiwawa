import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  const pool = globalForDb.pgPool ?? new Pool({
    connectionString,
    max: 10,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined
  });
  globalForDb.pgPool = pool;
  return drizzle(pool, { schema });
}
