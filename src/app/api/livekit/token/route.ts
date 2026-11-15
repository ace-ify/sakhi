import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room") || "parcha-room";
  const username = req.nextUrl.searchParams.get("username") || "dadi-user";

  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
    });

    at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: process.env.LIVEKIT_URL || "wss://parcha-demo.livekit.cloud",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

