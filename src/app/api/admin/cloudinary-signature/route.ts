import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";

export async function POST() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary is not configured on the server." }, { status: 503 });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "little-paws/pets";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature }, {
    headers: { "Cache-Control": "no-store" }
  });
}
