import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { dogs, inquiries } from "@/lib/db/schema";
import { inquirySchema, validationMessage } from "@/lib/validation";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const result = await getDb().select({
      id: inquiries.id, customerName: inquiries.customerName, email: inquiries.email,
      phone: inquiries.phone, message: inquiries.message, dogId: inquiries.dogId,
      dogName: dogs.name, status: inquiries.status, createdAt: inquiries.createdAt
    }).from(inquiries).leftJoin(dogs, eq(inquiries.dogId, dogs.id)).orderBy(desc(inquiries.createdAt));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load inquiries." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const parsed = inquirySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
    const [created] = await getDb().insert(inquiries).values(parsed.data).returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create inquiry. Check that the selected listing exists." }, { status: 400 });
  }
}
