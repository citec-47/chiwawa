import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { breeds, dogs } from "@/lib/db/schema";
import { dogSchema, validationMessage } from "@/lib/validation";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const result = await getDb().select({
      id: dogs.id, name: dogs.name, breedId: dogs.breedId, breedName: breeds.name,
      description: dogs.description, priceCents: dogs.priceCents, imageUrl: dogs.imageUrl,
      status: dogs.status, createdAt: dogs.createdAt, updatedAt: dogs.updatedAt
    }).from(dogs).innerJoin(breeds, eq(dogs.breedId, breeds.id)).orderBy(asc(dogs.createdAt));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load listings." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const parsed = dogSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 400 });
    const [created] = await getDb().insert(dogs).values(parsed.data).returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create listing. Check that its breed exists." }, { status: 400 });
  }
}
