import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { getDb } from "@/lib/db";
import { breeds, dogs, inquiries, inquiryDogs } from "@/lib/db/schema";
import { inquirySchema, validationMessage } from "@/lib/validation";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  try {
    const db = getDb();
    const result = await db.select({
      id: inquiries.id, customerName: inquiries.customerName, email: inquiries.email,
      phone: inquiries.phone, message: inquiries.message, dogId: inquiries.dogId,
      dogName: dogs.name, dogBreedName: breeds.name, dogImageUrl: dogs.imageUrl,
      status: inquiries.status, createdAt: inquiries.createdAt
    }).from(inquiries)
      .leftJoin(dogs, eq(inquiries.dogId, dogs.id))
      .leftJoin(breeds, eq(dogs.breedId, breeds.id))
      .orderBy(desc(inquiries.createdAt));
    const dogRows = result.length > 0
      ? await db.select({
        inquiryId: inquiryDogs.inquiryId,
        id: dogs.id,
        name: dogs.name,
        breedName: breeds.name,
        imageUrl: dogs.imageUrl
      }).from(inquiryDogs)
        .innerJoin(dogs, eq(inquiryDogs.dogId, dogs.id))
        .innerJoin(breeds, eq(dogs.breedId, breeds.id))
        .where(inArray(inquiryDogs.inquiryId, result.map((inquiry) => inquiry.id)))
      : [];
    const dogsByInquiry = new Map<string, typeof dogRows>();
    for (const dog of dogRows) {
      const current = dogsByInquiry.get(dog.inquiryId) ?? [];
      current.push(dog);
      dogsByInquiry.set(dog.inquiryId, current);
    }
    const response = result.map((inquiry) => {
      const selectedDogs = dogsByInquiry.get(inquiry.id);
      const dogsForInquiry = selectedDogs?.length
        ? selectedDogs.map(({ id, name, breedName, imageUrl }) => ({ id, name, breedName, imageUrl }))
        : inquiry.dogId && inquiry.dogName
          ? [{ id: inquiry.dogId, name: inquiry.dogName, breedName: inquiry.dogBreedName ?? "", imageUrl: inquiry.dogImageUrl ?? "" }]
          : [];
      return { ...inquiry, dogs: dogsForInquiry };
    });
    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
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
    const { dogIds, dogId, ...inquiryData } = parsed.data;
    const selectedDogIds = dogIds?.length ? dogIds : dogId ? [dogId] : [];
    const created = await getDb().transaction(async (tx) => {
      const [inquiry] = await tx.insert(inquiries).values({
        ...inquiryData,
        dogId: selectedDogIds[0] ?? null
      }).returning();
      if (selectedDogIds.length > 0) {
        await tx.insert(inquiryDogs).values(selectedDogIds.map((selectedDogId) => ({
          inquiryId: inquiry.id,
          dogId: selectedDogId
        })));
      }
      return inquiry;
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create inquiry. Check that the selected listing exists." }, { status: 400 });
  }
}
