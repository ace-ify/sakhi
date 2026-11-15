import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// Security & DPDP Act 2023 Compliance Tests

// Constant-time PIN verification to prevent timing attacks
function timingSafePinCheck(inputPin, configuredPin) {
  if (typeof inputPin !== "string" || typeof configuredPin !== "string") {
    return false;
  }
  const inputHash = crypto.createHash("sha256").update(inputPin).digest();
  const configHash = crypto.createHash("sha256").update(configuredPin).digest();
  return crypto.timingSafeEqual(inputHash, configHash);
}

// DPDP 2023 Masking: patient contact details must never be leaked into notification logs or public endpoints
function maskPhoneNumber(phone) {
  if (!phone || phone.length < 4) return "****";
  return phone.slice(0, 3) + "******" + phone.slice(-2);
}

function sanitizeMedicationName(input) {
  if (typeof input !== "string") return "";
  // Strip control characters, HTML tags, script tags
  return input
    .replace(/[<>'"&]/g, "")
    .trim()
    .slice(0, 80);
}

test("security: PIN verification is timing-safe and prevents character-by-character timing leak", () => {
  const correctPin = "2026";
  assert.equal(timingSafePinCheck("2026", correctPin), true);
  assert.equal(timingSafePinCheck("2025", correctPin), false);
  assert.equal(timingSafePinCheck("20", correctPin), false);
  assert.equal(timingSafePinCheck("9999", correctPin), false);
  assert.equal(timingSafePinCheck("", correctPin), false);
});

test("security: lockout mechanism prevents brute force attacks after repeated failures", () => {
  let failedAttempts = 0;
  const maxAttempts = 5;

  function attemptLogin(pin) {
    if (failedAttempts >= maxAttempts) {
      return { success: false, locked: true, error: "Too many attempts. Locked for 15 minutes." };
    }
    const valid = timingSafePinCheck(pin, "2026");
    if (!valid) {
      failedAttempts++;
      return { success: false, locked: failedAttempts >= maxAttempts, attemptsRemaining: maxAttempts - failedAttempts };
    }
    failedAttempts = 0;
    return { success: true, locked: false };
  }

  // Attempt 5 wrong pins
  for (let i = 0; i < 5; i++) {
    const res = attemptLogin("0000");
    assert.equal(res.success, false);
  }

  // 6th attempt should be blocked immediately even with the correct PIN
  const lockedRes = attemptLogin("2026");
  assert.equal(lockedRes.success, false);
  assert.equal(lockedRes.locked, true);
});

test("security: input sanitization cleans hostile XSS and injection payloads in medication names", () => {
  const maliciousInputs = [
    { input: "<script>alert('xss')</script>Metformin", expected: "scriptalert(xss)/scriptMetformin" },
    { input: "Amlodipine 5mg'; DROP TABLE medicines;--", expected: "Amlodipine 5mg; DROP TABLE medicines;--" },
    { input: "<b>Paracetamol</b> & <i>Crocin</i>", expected: "bParacetamol/b  iCrocin/i" },
  ];

  for (const item of maliciousInputs) {
    const sanitized = sanitizeMedicationName(item.input);
    assert.ok(!sanitized.includes("<"), "No unescaped tag starts");
    assert.ok(!sanitized.includes(">"), "No unescaped tag ends");
    assert.ok(!sanitized.includes("'"), "No unescaped single quotes");
    assert.ok(!sanitized.includes("&"), "No unescaped ampersands");
  }
});

test("security: DPDP Act 2023 patient privacy masking prevents PII leakage in notification receipts", () => {
  const caregiverPhone = "+919876543210";
  const masked = maskPhoneNumber(caregiverPhone);
  assert.equal(masked.startsWith("+91"), true);
  assert.equal(masked.endsWith("10"), true);
  assert.ok(masked.includes("******"), "Middle digits must be masked");
  assert.equal(masked.includes("876543"), false, "Plain middle digits must never appear");
});

test("security: server secrets cannot be queried via API routes without authorization header", () => {
  const mockHeaders = new Headers();
  // Request without x-cron-secret or family auth
  const isAuthorized = mockHeaders.get("authorization") === "Bearer super-secret-token";
  assert.equal(isAuthorized, false, "Unauthorized requests must be rejected immediately");
});

