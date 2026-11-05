import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL before running migrations.");

const client = new Client({ connectionString, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined });
try {
  await client.connect();
  const sql = await readFile(path.join(process.cwd(), "drizzle", "0000_initial.sql"), "utf8");
  await client.query(sql);
  await client.query("INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", ["0000_initial"]);
  console.log("Database schema is ready.");
} finally {
  await client.end();
}
