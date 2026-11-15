import test from "node:test";
import assert from "node:assert/strict";
import { parsePrescriptionAnalysis } from "../src/lib/prescription-parser.ts";

test("extracts only the expected prescription fields from a fenced Gemini response", () => {
  const result = parsePrescriptionAnalysis('```json\n{"doctorName":" Dr Rao ","medications":[{"name":" Metformin ","dosage":"500mg","time":"01:30 PM","instructions":"After lunch","frequency":"OD","ignore":"injected"}],"precautions":["Review glucose"],"followUp":"2 weeks","extra":"discard"}\n```');
  assert.equal(result.medications[0].name, "Metformin");
  assert.equal(result.medications[0].time, "01:30 PM");
  assert.equal(result.doctorName, "Dr Rao");
  assert.equal(result.precautions[0], "Review glucose");
  assert.equal("extra" in result, false);
  assert.equal("ignore" in result.medications[0], false);
});

test("an unreadable image may return an empty medicine list without inventing doses", () => {
  assert.deepEqual(parsePrescriptionAnalysis('{"medications":[]}').medications, []);
});

test("malformed or oversized model output is rejected before reaching the schedule", () => {
  assert.throws(() => parsePrescriptionAnalysis("not JSON"), /invalid JSON/);
  assert.throws(() => parsePrescriptionAnalysis('{"medications":"Metformin"}'), /medicine list/);
  assert.throws(() => parsePrescriptionAnalysis(JSON.stringify({ medications: [{ name: "A".repeat(201) }] })), /medicine name/);
  assert.throws(() => parsePrescriptionAnalysis(JSON.stringify({ medications: [null] })), /medicine 1/);
});
