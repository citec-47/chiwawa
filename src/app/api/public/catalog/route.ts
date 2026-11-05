import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { breeds, dogs } from "@/lib/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const [allBreeds, listings] = await Promise.all([
      db.select().from(breeds).orderBy(asc(breeds.name)),
      db.select({
        id: dogs.id, name: dogs.name, breedId: dogs.breedId, breedName: breeds.name,
        description: dogs.description, priceCents: dogs.priceCents, imageUrl: dogs.imageUrl
      }).from(dogs).innerJoin(breeds, eq(dogs.breedId, breeds.id))
        .where(eq(dogs.status, "published")).orderBy(asc(dogs.createdAt))
    ]);
    return NextResponse.json({ breeds: allBreeds, dogs: listings }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The catalog is temporarily unavailable." }, { status: 503 });
  }
}
