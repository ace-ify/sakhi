import test from "node:test";
import assert from "node:assert/strict";
import { validateSharedHealthState } from "../src/lib/health-state-validator.ts";

const state = () => ({
  medications: [{ id: "med-1", name: "Metformin", dosage: "500mg", time: "01:30 PM", instructions: "After lunch", taken: false }],
  appointments: [{ id: "apt-1", doctorName: "Dr Rao", specialty: "General", hospital: "Clinic", date: "2026-11-16", time: "10:30 AM", status: "UPCOMING" }],
  doses: [{ id: "2026-11-15:med-1", medicationId: "med-1", date: "2026-11-15", status: "TAKEN", recordedAt: "2026-11-15T08:00:00.000Z" }],
});

test("accepts a complete shared schedule and removes untrusted extra fields", () => {
  const input = state();
  input.medications[0].extra = "ignore";
  const saved = validateSharedHealthState(input);
  assert.equal(saved.medications[0].name, "Metformin");
  assert.equal(saved.doses[0].status, "TAKEN");
  assert.equal("extra" in saved.medications[0], false);
});

test("rejects malformed medicine, appointment, and dose records", () => {
  const invalidTime = state();
  invalidTime.medications[0].time = "tomorrow";
  assert.throws(() => validateSharedHealthState(invalidTime), /medicine time/);
  const invalidStatus = state();
  invalidStatus.appointments[0].status = "SENT";
  assert.throws(() => validateSharedHealthState(invalidStatus), /appointment status/);
  const invalidDose = state();
  invalidDose.doses[0].status = "MAYBE";
  assert.throws(() => validateSharedHealthState(invalidDose), /dose status/);
});

test("rejects oversized schedule arrays and invalid root shapes", () => {
  assert.throws(() => validateSharedHealthState(null), /record/);
  assert.throws(() => validateSharedHealthState({ medications: [], appointments: [], doses: Array(10_001).fill({}) }), /lists/);
});
