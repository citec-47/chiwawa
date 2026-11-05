import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { dogs, inquiries } from "@/lib/db/schema";
import { inquirySchema, validationMessage } from "@/lib/validation";

const recentPosts = new Map<string, number[]>();
function isRateLimited(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (recentPosts.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 5) return true;
  recent.push(now);
  recentPosts.set(key, recent);
  if (recentPosts.size > 2000) recentPosts.clear();
  return false;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) return NextResponse.json({ error: "Please wait a minute before sending another inquiry." }, { status: 429 });
  try {
    const parsed = inquirySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
    const db = getDb();
    if (parsed.data.dogId) {
      const [dog] = await db.select({ id: dogs.id }).from(dogs)
        .where(and(eq(dogs.id, parsed.data.dogId), eq(dogs.status, "published"))).limit(1);
      if (!dog) return NextResponse.json({ error: "That listing is not available for inquiry." }, { status: 400 });
    }
    const [created] = await db.insert(inquiries).values(parsed.data).returning({ id: inquiries.id });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We couldn't save your message just now. Please try again later." }, { status: 503 });
  }
}
