import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { adminSessions, adminUsers } from "@/lib/db/schema";

export const SESSION_COOKIE = "littlepaws_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const db = getDb();
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  await db.insert(adminSessions).values({
    adminId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  });
  return token;
}

export async function findAdminByToken(token: string | undefined) {
  if (!token || token.length > 100) return null;
  const db = getDb();
  const [record] = await db.select({
    id: adminUsers.id,
    email: adminUsers.email,
    sessionId: adminSessions.id
  }).from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
    .where(and(eq(adminSessions.tokenHash, hashToken(token)), gt(adminSessions.expiresAt, new Date())))
    .limit(1);
  return record ?? null;
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  return findAdminByToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000
  };
}
