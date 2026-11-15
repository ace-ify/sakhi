import { NextRequest, NextResponse } from "next/server";
import { deliverNotification, type AlertChannel, type AlertType } from "@/lib/notification-delivery";

const eventTypes = new Set<AlertType>(["SOS_EMERGENCY", "DOSE_SKIPPED", "DOSE_MISSED", "DOSE_UPCOMING", "APPOINTMENT_UPCOMING"]);

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
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
