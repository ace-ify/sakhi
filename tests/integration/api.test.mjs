import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

async function unusedPort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("production API rejects unauthorized and malformed requests", { timeout: 60_000 }, async (t) => {
  const port = await unusedPort();
  const base = `http://127.0.0.1:${port}`;
  const code = "integration-test-family-code-12345";
  const child = spawn(process.execPath, [fileURLToPath(new URL("../../node_modules/next/dist/bin/next", import.meta.url)), "start", "-p", String(port)], {
    cwd: projectRoot,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", FAMILY_PASSCODE: code, UPSTASH_REDIS_REST_URL: "http://127.0.0.1:1", UPSTASH_REDIS_REST_TOKEN: "test", GEMINI_API_KEY: "test", GROQ_API_KEY: "", CAREGIVER_EMAIL: "", RESEND_API_KEY: "", RESEND_FROM_EMAIL: "", TWILIO_ACCOUNT_SID: "", TWILIO_AUTH_TOKEN: "", TWILIO_FROM_NUMBER: "", CAREGIVER_PHONE: "", REMINDER_CRON_SECRET: "integration-cron-secret" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (data) => { logs += data.toString(); });
  child.stderr.on("data", (data) => { logs += data.toString(); });
  t.after(() => child.kill());
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) break;
    try { const response = await fetch(`${base}/api/reminders/run`); if (response.status === 401) { ready = true; break; } } catch { /* Wait for server startup. */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, `Production server did not start: ${logs.slice(-1000)}`);
  const post = (path, body, headers = {}) => fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  const family = { "x-family-passcode": code };

  await t.test("family authentication checks the configured code", async () => {
    assert.equal((await post("/api/family-state/auth", { passcode: "1234" })).status, 401);
    assert.equal((await post("/api/family-state/auth", { passcode: code })).status, 200);
  });
  await t.test("shared state rejects missing access and invalid records", async () => {
    assert.equal((await fetch(`${base}/api/family-state`)).status, 401);
    const response = await fetch(`${base}/api/family-state`, { method: "PUT", headers: { "content-type": "application/json", ...family }, body: JSON.stringify({ medications: [{ id: "x", name: "A", time: "yesterday" }], appointments: [], doses: [] }) });
    assert.equal(response.status, 400);
  });
  await t.test("notifications cannot be triggered without access or a provider", async () => {
    const body = { type: "DOSE_SKIPPED", details: "Smoke check" };
    assert.equal((await post("/api/notify", body)).status, 401);
    assert.equal((await post("/api/notify", body, family)).status, 503);
  });
  await t.test("prescription images and safety input are validated", async () => {
    assert.equal((await post("/api/gemini/analyze-prescription", { imageBase64: "invalid" })).status, 400);
    assert.equal((await post("/api/safety/check", { drugName: "" })).status, 400);
  });
  await t.test("background reminder endpoint requires its own secret", async () => {
    assert.equal((await fetch(`${base}/api/reminders/run`)).status, 401);
  });
});
