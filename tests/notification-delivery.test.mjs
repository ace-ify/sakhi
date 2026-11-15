import test from "node:test";
import assert from "node:assert/strict";
import { deliverNotification } from "../src/lib/notification-delivery.ts";

const keys = ["CAREGIVER_EMAIL", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "CAREGIVER_PHONE"];

async function withProviders(values, run) {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, values);
  try { await run(); }
  finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test("email reminder sends to configured caregiver and reports provider acceptance", async (t) => {
  await withProviders({ CAREGIVER_EMAIL: "care@example.com", RESEND_API_KEY: "test-key", RESEND_FROM_EMAIL: "Sakhi <hello@example.com>" }, async () => {
    t.mock.method(globalThis, "fetch", async (url, options) => {
      assert.equal(url, "https://api.resend.com/emails");
      assert.deepEqual(JSON.parse(options.body).to, ["care@example.com"]);
      assert.match(JSON.parse(options.body).text, /due at/);
      return new Response(JSON.stringify({ id: "email-123" }), { status: 200 });
    });
    assert.deepEqual(await deliverNotification("DOSE_UPCOMING", "Metformin due at 1:30 PM", "email"), [{ channel: "email", status: "accepted", id: "email-123" }]);
  });
});

test("missed dose queues a call and escapes spoken XML content", async (t) => {
  await withProviders({ TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "secret", TWILIO_FROM_NUMBER: "+15550001111", CAREGIVER_PHONE: "+15550002222" }, async () => {
    t.mock.method(globalThis, "fetch", async (url, options) => {
      assert.match(url, /Calls\.json$/);
      const body = new URLSearchParams(options.body);
      assert.equal(body.get("To"), "+15550002222");
      assert.equal(body.get("Twiml"), "<Response><Say>A B was missed.</Say></Response>");
      return new Response(JSON.stringify({ sid: "CA123" }), { status: 201 });
    });
    assert.deepEqual(await deliverNotification("DOSE_MISSED", "A&B was missed.", "call"), [{ channel: "call", status: "queued", id: "CA123" }]);
  });
});

test("provider rejection is never reported as a sent notification", async (t) => {
  await withProviders({ CAREGIVER_EMAIL: "care@example.com", RESEND_API_KEY: "test-key", RESEND_FROM_EMAIL: "hello@example.com" }, async () => {
    t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ message: "Rejected" }), { status: 400 }));
    assert.deepEqual(await deliverNotification("APPOINTMENT_UPCOMING", "Doctor visit", "email"), [{ channel: "email", status: "failed", error: "Rejected" }]);
  });
});

test("an unconfigured provider produces no false success", async () => {
  await withProviders({}, async () => assert.deepEqual(await deliverNotification("SOS_EMERGENCY", "Help", "both"), []));
});
