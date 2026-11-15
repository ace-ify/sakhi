import test from "node:test";
import assert from "node:assert/strict";

// Adherence Calculation Logic (DPDP 2023 & Geriatric Adherence Standard)
function calculateAdherence(totalDoses, takenDoses) {
  if (totalDoses === 0) return { pct: 100, status: "OPTIMAL", alert: false };
  const pct = Math.min(100, (takenDoses / totalDoses) * 100);
  const status = pct >= 90 ? "OPTIMAL" : pct >= 75 ? "MODERATE" : "CRITICAL_GAP";
  return {
    pct: Math.round(pct * 10) / 10,
    status,
    alert: pct < 75,
  };
}

// Passcode Gate Verification Logic
function verifyCaregiverPasscode(inputPin, correctPin = "1234") {
  if (typeof inputPin !== "string" || inputPin.length !== 4) return false;
  return inputPin === correctPin;
}

// Levenshtein Similarity for LASA drug safety
function calculateDrugSimilarity(a, b) {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  const dp = Array.from({ length: s1.length + 1 }, () => new Array(s2.length + 1).fill(0));
  for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1 : Math.max(0, 1 - dp[s1.length][s2.length] / maxLen);
}

test("1. Adherence Tracker should flag critical gap when missed doses drop below 75%", () => {
  const good = calculateAdherence(10, 9);
  assert.equal(good.status, "OPTIMAL");
  assert.equal(good.alert, false);

  const critical = calculateAdherence(10, 6);
  assert.equal(critical.status, "CRITICAL_GAP");
  assert.equal(critical.alert, true);
});

test("2. Caregiver Passcode Security should strictly enforce 4-digit PIN", () => {
  assert.equal(verifyCaregiverPasscode("1234"), true);
  assert.equal(verifyCaregiverPasscode("0000"), false);
  assert.equal(verifyCaregiverPasscode("123"), false);
  assert.equal(verifyCaregiverPasscode("12345"), false);
});

test("3. LASA Drug Safety Guard detects confusing look-alike sound-alike prescriptions", () => {
  const sim = calculateDrugSimilarity("Telmisartan", "Valsartan");
  assert.ok(sim > 0.60, "Similarity should detect high LASA overlap between Telmisartan and Valsartan");
  const exact = calculateDrugSimilarity("Telmisartan", "Telmisartan");
  assert.equal(exact, 1.0);
});
