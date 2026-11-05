import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { breeds } from "@/lib/db/schema";
import { breedSchema, validationMessage } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid breed id." }, { status: 400 });
  try {
    const parsed = breedSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
    const [updated] = await getDb().update(breeds).set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(breeds.id, id)).returning();
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Breed not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not update breed." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid breed id." }, { status: 400 });
  try {
    const [removed] = await getDb().delete(breeds).where(eq(breeds.id, id)).returning({ id: breeds.id });
    return removed ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Breed not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not delete breed. Remove its listings first." }, { status: 409 });
  }
}
