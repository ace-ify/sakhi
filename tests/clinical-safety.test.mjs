import test from "node:test";
import assert from "node:assert/strict";

// Clinical Safety & Drug Interaction Guardrails

const HIGH_RISK_COMBINATIONS = [
  { drugA: "Warfarin", drugB: "Aspirin", severity: "MAJOR", reason: "Severe bleeding risk" },
  { drugA: "Sildenafil", drugB: "Nitroglycerin", severity: "CONTRAINDICATED", reason: "Fatal hypotension risk" },
  { drugA: "Metformin", drugB: "Iodinated Contrast", severity: "MAJOR", reason: "Risk of lactic acidosis" }
];

function checkInteractions(medications) {
  const warnings = [];
  const names = medications.map((m) => m.toLowerCase().trim());

  for (const rule of HIGH_RISK_COMBINATIONS) {
    const hasA = names.some((n) => n.includes(rule.drugA.toLowerCase()));
    const hasB = names.some((n) => n.includes(rule.drugB.toLowerCase()));
    if (hasA && hasB) {
      warnings.push({
        pair: `${rule.drugA} + ${rule.drugB}`,
        severity: rule.severity,
        reason: rule.reason
      });
    }
  }
  return warnings;
}

function validateDosageBounds(drugName, dosageMg) {
  const limits = {
    paracetamol: { maxSingleDoseMg: 1000, maxDailyDoseMg: 4000 },
    metformin: { maxSingleDoseMg: 1000, maxDailyDoseMg: 2550 },
    amlodipine: { maxSingleDoseMg: 10, maxDailyDoseMg: 10 },
    aspirin: { maxSingleDoseMg: 325, maxDailyDoseMg: 1000 }
  };

  const key = drugName.toLowerCase().trim();
  const limit = limits[key];
  if (!limit) return { valid: true };

  if (dosageMg > limit.maxSingleDoseMg) {
    return { valid: false, reason: `Exceeds maximum safe single dose of ${limit.maxSingleDoseMg}mg` };
  }
  return { valid: true };
}

test("clinical safety: detects dangerous drug-drug interactions (e.g. Warfarin + Aspirin)", () => {
  const currentMeds = ["Warfarin 5mg", "Aspirin 75mg", "Atorvastatin 10mg"];
  const warnings = checkInteractions(currentMeds);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].severity, "MAJOR");
  assert.ok(warnings[0].reason.includes("bleeding"));
});

test("clinical safety: passes safely when no contraindicated medications coexist", () => {
  const safeMeds = ["Metformin 500mg", "Amlodipine 5mg", "Vitamin D3"];
  const warnings = checkInteractions(safeMeds);
  assert.equal(warnings.length, 0);
});

test("clinical safety: flags excessive single dosages above safe pharmacopeia thresholds", () => {
  const unsafeParacetamol = validateDosageBounds("Paracetamol", 2000);
  assert.equal(unsafeParacetamol.valid, false);
  assert.ok(unsafeParacetamol.reason.includes("maximum safe single dose"));

  const safeParacetamol = validateDosageBounds("Paracetamol", 650);
  assert.equal(safeParacetamol.valid, true);

  const unsafeAmlodipine = validateDosageBounds("Amlodipine", 25);
  assert.equal(unsafeAmlodipine.valid, false);
});

test("clinical safety: duplicate active ingredient check prevents accidental overdose", () => {
  const activeIngredients = [
    { brand: "Crocin 650", active: "Paracetamol", strengthMg: 650 },
    { brand: "Dolo 650", active: "Paracetamol", strengthMg: 650 }
  ];

  function detectDuplicateIngredients(list) {
    const counts = {};
    for (const item of list) {
      counts[item.active] = (counts[item.active] || 0) + 1;
    }
    return Object.keys(counts).filter((active) => counts[active] > 1);
  }

  const duplicates = detectDuplicateIngredients(activeIngredients);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0], "Paracetamol");
});

