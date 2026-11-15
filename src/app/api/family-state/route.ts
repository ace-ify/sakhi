import { NextRequest, NextResponse } from "next/server";
import { readHealthState, writeHealthState } from "@/lib/server-health-state";
import { validFamilyCode } from "@/lib/family-auth";
import { validateSharedHealthState } from "@/lib/health-state-validator";
import { hasSameOrigin } from "@/lib/request-origin";

function authorized(request: NextRequest) {
  return validFamilyCode(request.headers.get("x-family-passcode"), process.env.FAMILY_PASSCODE);
}

export async function GET(request: NextRequest) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return NextResponse.json({ mode: "local" }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: "Invalid family passcode" }, { status: 401 });
  try { return NextResponse.json({ state: await readHealthState() }); }
  catch { return NextResponse.json({ error: "Shared storage unavailable" }, { status: 502 }); }
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Invalid family passcode" }, { status: 401 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 100_000) return NextResponse.json({ error: "State too large" }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (JSON.stringify(body).length > 100_000) return NextResponse.json({ error: "State too large" }, { status: 413 });
  let state;
  try { state = validateSharedHealthState(body); } catch { return NextResponse.json({ error: "Invalid state" }, { status: 400 }); }
  try {
    await writeHealthState(state);
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: "Shared storage unavailable" }, { status: 502 }); }
}
