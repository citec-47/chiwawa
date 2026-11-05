import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createAdminSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string" || body.email.length > 254 || body.password.length > 200) {
      return jsonError("Enter a valid email and password.", 400);
    }
    const [admin] = await getDb().select().from(adminUsers)
      .where(eq(adminUsers.email, body.email.trim().toLowerCase())).limit(1);
    const valid = admin ? await bcrypt.compare(body.password, admin.passwordHash) : false;
    if (!valid || !admin) return jsonError("Email or password is incorrect.", 401);

    const token = await createAdminSession(admin.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch {
    return jsonError("Sign-in is temporarily unavailable. Check the server configuration.", 503);
  }
}
