import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { breeds } from "@/lib/db/schema";
import { breedSchema, validationMessage } from "@/lib/validation";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const result = await getDb().select().from(breeds).orderBy(asc(breeds.name));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load breeds." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const parsed = breedSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
    const [created] = await getDb().insert(breeds).values(parsed.data).returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create breed. Check that the name and slug are unique." }, { status: 400 });
  }
}
