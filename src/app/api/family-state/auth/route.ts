import { NextRequest, NextResponse } from "next/server";
import { validFamilyCode } from "@/lib/family-auth";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const expected = process.env.FAMILY_PASSCODE;
  if (!expected || expected.length < 12 || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return NextResponse.json({ error: "Shared family access is not configured" }, { status: 503 });
  let supplied: unknown;
  try { supplied = (await request.json()).passcode; } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof supplied !== "string" || !validFamilyCode(supplied, expected)) return NextResponse.json({ error: "Invalid family code" }, { status: 401 });
  return NextResponse.json({ authorized: true });
}
