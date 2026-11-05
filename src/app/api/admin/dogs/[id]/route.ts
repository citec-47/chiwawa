import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { dogs } from "@/lib/db/schema";
import { dogSchema, validationMessage } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
  try {
    const parsed = dogSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
    const [updated] = await getDb().update(dogs).set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(dogs.id, id)).returning();
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Listing not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not update listing." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
  try {
    const [removed] = await getDb().delete(dogs).where(eq(dogs.id, id)).returning({ id: dogs.id });
    return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Listing not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not delete listing." }, { status: 400 });
  }
}
