import test from "node:test";
import assert from "node:assert/strict";
import { checkKnownLasaPairs } from "../src/lib/lasa-check.ts";

test("reports the paired look-alike name for an exact known medicine", () => {
  const alerts = checkKnownLasaPairs("Metformin 500mg");
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].conflictingDrug, "Metronidazole");
  assert.equal(alerts[0].severity, "CRITICAL");
  assert.equal(alerts[0].similarityScore, 1);
});

test("does not flag every known pair for a different name", () => {
  assert.deepEqual(checkKnownLasaPairs("Paracetamol"), []);
  assert.deepEqual(checkKnownLasaPairs("Valsartan").map((alert) => alert.conflictingDrug), ["Telmisartan"]);
});
