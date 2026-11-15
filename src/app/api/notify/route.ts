import { NextRequest, NextResponse } from "next/server";
import { deliverNotification, type AlertChannel, type AlertType } from "@/lib/notification-delivery";
import { validFamilyCode } from "@/lib/family-auth";
import { hasSameOrigin } from "@/lib/request-origin";

const eventTypes = new Set<AlertType>(["SOS_EMERGENCY", "DOSE_SKIPPED", "DOSE_MISSED", "DOSE_UPCOMING", "APPOINTMENT_UPCOMING"]);

export async function POST(request: NextRequest) {
  const familyCode = process.env.FAMILY_PASSCODE;
  if (!familyCode || familyCode.length < 12) return NextResponse.json({ error: "Family access is not configured" }, { status: 503 });
  if (!validFamilyCode(request.headers.get("x-family-passcode"), familyCode)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const { type, details, channel = "both" } = body as Record<string, unknown>;
  if ((channel !== "both" && channel !== "email" && channel !== "call") || typeof type !== "string" || !eventTypes.has(type as AlertType) || typeof details !== "string" || !details.trim() || details.length > 500) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const outcomes = await deliverNotification(type as AlertType, details, channel as AlertChannel);
  if (!outcomes.length) return NextResponse.json({ error: "Configure a provider and caregiver destination" }, { status: 503 });
  const success = outcomes.some((item) => item.status === "accepted" || item.status === "queued");
  return NextResponse.json({ success, outcomes }, { status: success ? 202 : 502 });
}
