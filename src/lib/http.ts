import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function noStoreJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}
