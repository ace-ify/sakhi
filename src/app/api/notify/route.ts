import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipient = "prashant.caregiver@example.com", patientName = "Prabha Devi", type = "appointment", details } = body;

    console.log(`[Sahara Notify API] Dispatching alert to ${recipient}:`, { patientName, type, details });

    // In production, integrate SendGrid, Resend, or Google Cloud Pub/Sub
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Email alert successfully dispatched to ${recipient}`,
      deliveryStatus: "Delivered",
      details: details || "Dr. Arvind Sharma (Cardiology) - Tomorrow at 10:30 AM",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch email" },
      { status: 500 }
    );
  }
}
