import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { inquiries } from "@/lib/db/schema";
import { inquiryUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid inquiry id." }, { status: 400 });
  try {
    const parsed = inquiryUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Choose a valid inquiry status." }, { status: 400 });
    const [updated] = await getDb().update(inquiries).set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(inquiries.id, id)).returning();
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not update inquiry." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid inquiry id." }, { status: 400 });
  try {
    const [removed] = await getDb().delete(inquiries).where(eq(inquiries.id, id)).returning({ id: inquiries.id });
    return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not delete inquiry." }, { status: 400 });
  }
}
