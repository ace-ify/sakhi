import { NextRequest, NextResponse } from "next/server";
import { readHealthState, writeHealthState } from "@/lib/server-health-state";
import { validFamilyCode } from "@/lib/family-auth";

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
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 100_000) return NextResponse.json({ error: "State too large" }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  const state = body as Record<string, unknown>;
  if (!Array.isArray(state.medications) || !Array.isArray(state.appointments) || !Array.isArray(state.doses) || JSON.stringify(body).length > 100_000 ||
      !state.medications.every((item) => item && typeof item.id === "string" && typeof item.name === "string" && typeof item.time === "string") ||
      !state.appointments.every((item) => item && typeof item.id === "string" && typeof item.date === "string" && typeof item.time === "string") ||
      !state.doses.every((item) => item && typeof item.medicationId === "string" && typeof item.date === "string" && (item.status === "TAKEN" || item.status === "SKIPPED"))) return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  try {
    await writeHealthState({ medications: state.medications, appointments: state.appointments, doses: state.doses });
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: "Shared storage unavailable" }, { status: 502 }); }
}
