import pg from "pg";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL before seeding.");
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const passwordHash = process.env.ADMIN_PASSWORD_HASH;
if (!email || !passwordHash || !/^\$2[aby]\$\d\d\$/.test(passwordHash)) {
  throw new Error("Set ADMIN_EMAIL and a valid ADMIN_PASSWORD_HASH before seeding.");
}
const client = new Client({ connectionString, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined });
try {
  await client.connect();
  await client.query("BEGIN");
  const [chihuahua] = (await client.query(
    `INSERT INTO breeds (name, slug, description, image_url)
     VALUES ('Chihuahua', 'chihuahua', '', '/images/chihuahua.jpg')
     ON CONFLICT (slug) DO UPDATE SET
       description = CASE
         WHEN breeds.description = 'A breed profile for owner-provided details and photos.' THEN EXCLUDED.description
         ELSE breeds.description
       END,
       updated_at = now()
     RETURNING id`
  )).rows;
  const [pomeranian] = (await client.query(
    `INSERT INTO breeds (name, slug, description, image_url)
     VALUES ('Pomeranian', 'pomeranian', '', '/images/pomeranian.jpg')
     ON CONFLICT (slug) DO UPDATE SET
       description = CASE
         WHEN breeds.description = 'A breed profile for owner-provided details and photos.' THEN EXCLUDED.description
         ELSE breeds.description
       END,
       updated_at = now()
     RETURNING id`
  )).rows;

  await client.query(
    `INSERT INTO dogs (name, breed_id, description, price_cents, image_url, status)
     VALUES ($1, $2, $3, $4, $5, 'draft')
     ON CONFLICT (name, breed_id) DO NOTHING`,
    ["Chihuahua listing — owner review required", chihuahua.id, "Starter listing. Add verified details and review before publication.", 85000, "/images/chihuahua-listing.jpg"]
  );
  await client.query(
    `INSERT INTO dogs (name, breed_id, description, price_cents, image_url, status)
     VALUES ($1, $2, $3, $4, $5, 'draft')
     ON CONFLICT (name, breed_id) DO NOTHING`,
    ["Pomeranian listing — owner review required", pomeranian.id, "Starter listing. Add verified details and review before publication.", 110000, "/images/pomeranian-listing.jpg"]
  );
  await client.query(
    `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, passwordHash]
  );
  await client.query("COMMIT");
  console.log("Starter breeds, draft listings, and administrator are ready.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
