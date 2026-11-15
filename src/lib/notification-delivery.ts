export type AlertType = "SOS_EMERGENCY" | "DOSE_SKIPPED" | "DOSE_MISSED" | "DOSE_UPCOMING" | "APPOINTMENT_UPCOMING";
export type AlertChannel = "email" | "call" | "both";
export type DeliveryOutcome = { channel: "email" | "call"; status: "accepted" | "queued" | "failed"; id?: string; error?: string };

export async function deliverNotification(type: AlertType, details: string, channel: AlertChannel): Promise<DeliveryOutcome[]> {
  const outcomes: DeliveryOutcome[] = [];
  if (channel !== "call") {
    const { CAREGIVER_EMAIL: to, RESEND_API_KEY: key, RESEND_FROM_EMAIL: from } = process.env;
    if (to && key && from) {
      try {
        const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject: `Sakhi: ${type.replaceAll("_", " ")}`, text: details }) });
        const data = await response.json();
        outcomes.push(response.ok ? { channel: "email", status: "accepted", id: data.id } : { channel: "email", status: "failed", error: data.message || `Resend ${response.status}` });
      } catch { outcomes.push({ channel: "email", status: "failed", error: "Provider unavailable" }); }
    }
  }
  if (channel !== "email") {
    const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM_NUMBER: from, CAREGIVER_PHONE: to } = process.env;
    if (sid && token && from && to) {
      try {
        const speech = details.replace(/[<>&"']/g, " ");
        const params = new URLSearchParams({ To: to, From: from, Twiml: `<Response><Say>${speech}</Say></Response>` });
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
        const data = await response.json();
        outcomes.push(response.ok ? { channel: "call", status: "queued", id: data.sid } : { channel: "call", status: "failed", error: data.message || `Twilio ${response.status}` });
      } catch { outcomes.push({ channel: "call", status: "failed", error: "Provider unavailable" }); }
    }
  }
  return outcomes;
}
