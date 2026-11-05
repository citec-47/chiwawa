import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findAdminByToken, SESSION_COOKIE } from "@/lib/auth";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const admin = await findAdminByToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!admin) {
    return { admin: null, response: NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 }) };
  }
  return { admin, response: null };
}
