import { NextRequest, NextResponse } from "next/server";
import { deliverNotification } from "@/lib/notification-delivery";
import { reminderEvents } from "@/lib/reminder-events";
import { readHealthState, redisCommand } from "@/lib/server-health-state";

export async function GET(request: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET;
  if (!secret || request.nextUrl.searchParams.get("token") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const state = await readHealthState();
    if (!state) return NextResponse.json({ checked: 0, delivered: 0 });
    const events = reminderEvents(state, new Date(), process.env.APP_TIME_ZONE || "Asia/Kolkata");
    let delivered = 0;
    const failures: string[] = [];
    for (const event of events) {
      for (const channel of event.channel === "both" ? ["email", "call"] as const : [event.channel]) {
        const key = `sakhi:reminder:${event.key}:${channel}`;
        const locked = await redisCommand(["SET", key, "processing", "NX", "EX", 120]);
        if (locked !== "OK") continue;
        const outcomes = await deliverNotification(event.type, event.details, channel);
        if (outcomes.some((outcome) => outcome.status === "accepted" || outcome.status === "queued")) {
          await redisCommand(["SET", key, "sent", "EX", 60 * 60 * 24 * 7]);
          delivered++;
        } else {
          await redisCommand(["DEL", key]);
          failures.push(`${event.key}:${channel}`);
        }
      }
    }
    return NextResponse.json({ checked: events.length, delivered, failures }, { status: failures.length ? 502 : 200 });
  } catch { return NextResponse.json({ error: "Reminder storage unavailable" }, { status: 502 }); }
}

export const POST = GET;
