import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { breeds, dogs } from "@/lib/db/schema";

export type PublicBreed = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
};

export type PublicDog = {
  id: string;
  name: string;
  breedId: string;
  breedName: string;
  description: string;
  priceCents: number;
  imageUrl: string;
};

const starterBreeds: PublicBreed[] = [
  { id: "starter-chihuahua", name: "Chihuahua", slug: "chihuahua", description: "", imageUrl: "/images/chihuahua.jpg" },
  { id: "starter-pomeranian", name: "Pomeranian", slug: "pomeranian", description: "", imageUrl: "/images/pomeranian.jpg" }
];

export async function getPublicCatalog(): Promise<{ breeds: PublicBreed[]; dogs: PublicDog[]; connected: boolean }> {
  if (!process.env.DATABASE_URL) {
    return { breeds: starterBreeds, dogs: [], connected: false };
  }
  const db = getDb();
  const [breedRows, dogRows] = await Promise.all([
    db.select({
      id: breeds.id, name: breeds.name, slug: breeds.slug,
      description: breeds.description, imageUrl: breeds.imageUrl
    }).from(breeds).orderBy(asc(breeds.name)),
    db.select({
      id: dogs.id, name: dogs.name, breedId: dogs.breedId, breedName: breeds.name,
      description: dogs.description, priceCents: dogs.priceCents, imageUrl: dogs.imageUrl
    }).from(dogs).innerJoin(breeds, eq(dogs.breedId, breeds.id))
      .where(eq(dogs.status, "published")).orderBy(asc(dogs.createdAt))
  ]);
  return { breeds: breedRows, dogs: dogRows, connected: true };
}
