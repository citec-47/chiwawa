import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hashToken, SESSION_COOKIE } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { adminSessions } from "@/lib/db/schema";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
    } catch {
      // The response still clears the browser cookie when the database is unavailable.
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
