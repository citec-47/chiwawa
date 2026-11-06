import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { breeds, dogs, inquiries, inquiryDogs } from "@/lib/db/schema";
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
    const selectedDogIds = parsed.data.dogIds?.length ? parsed.data.dogIds : (parsed.data.dogId ? [parsed.data.dogId] : []);
    const selectedDogRows = selectedDogIds.length
      ? await db.select({
        id: dogs.id,
        name: dogs.name,
        breedName: breeds.name,
        priceCents: dogs.priceCents
      }).from(dogs).innerJoin(breeds, eq(dogs.breedId, breeds.id))
        .where(and(inArray(dogs.id, selectedDogIds), eq(dogs.status, "published")))
      : [];
    const dogsById = new Map(selectedDogRows.map((dog) => [dog.id, dog]));
    const selectedDogs = selectedDogIds.flatMap((id) => {
      const dog = dogsById.get(id);
      return dog ? [dog] : [];
    });
    if (selectedDogs.length !== selectedDogIds.length) {
      return NextResponse.json({ error: "One of those listings is no longer available. Please refresh and try again." }, { status: 400 });
    }
    const message = selectedDogs.length
      ? `Asking about: ${selectedDogs.map((dog) => `${dog.name} (${dog.breedName}) — ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(dog.priceCents / 100)}`).join(", ")}\n\n${parsed.data.message}`
      : parsed.data.message;
    if (message.length > 3000) {
      return NextResponse.json({ error: "Please shorten your message and try again." }, { status: 400 });
    }
    const created = await db.transaction(async (tx) => {
      const [inquiry] = await tx.insert(inquiries).values({
        customerName: parsed.data.customerName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message,
        dogId: selectedDogs[0]?.id ?? null
      }).returning({ id: inquiries.id });
      if (selectedDogs.length > 0) {
        await tx.insert(inquiryDogs).values(selectedDogs.map((dog) => ({
          inquiryId: inquiry.id,
          dogId: dog.id
        })));
      }
      return inquiry;
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We couldn't save your message just now. Please try again later." }, { status: 503 });
  }
}
