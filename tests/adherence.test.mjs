import test from "node:test";
import assert from "node:assert/strict";

function calculateAdherence(doseHistory) {
  if (!doseHistory || doseHistory.length === 0) {
    return { percentage: 100, takenCount: 0, totalCount: 0, streak: 0 };
  }

  const taken = doseHistory.filter((d) => d.status === "taken").length;
  const total = doseHistory.filter((d) => d.status === "taken" || d.status === "missed").length;

  if (total === 0) return { percentage: 100, takenCount: 0, totalCount: 0, streak: 0 };

  const percentage = Math.round((taken / total) * 100);

  let streak = 0;
  for (let i = doseHistory.length - 1; i >= 0; i--) {
    if (doseHistory[i].status === "taken") {
      streak++;
    } else if (doseHistory[i].status === "missed") {
      break;
    }
  }

  return { percentage, takenCount: taken, totalCount: total, streak };
}

function analyzeMostMissedSlot(doseHistory) {
  const missedBySlot = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const d of doseHistory) {
    if (d.status === "missed" && missedBySlot[d.slot] !== undefined) {
      missedBySlot[d.slot]++;
    }
  }

  let worstSlot = "none";
  let maxMissed = 0;
  for (const [slot, count] of Object.entries(missedBySlot)) {
    if (count > maxMissed) {
      maxMissed = count;
      worstSlot = slot;
    }
  }
  return { worstSlot, maxMissed, breakdown: missedBySlot };
}

test("adherence: calculates accurate 7-day adherence percentage", () => {
  const sampleHistory = [
    { id: "1", status: "taken", slot: "morning" },
    { id: "2", status: "taken", slot: "evening" },
    { id: "3", status: "missed", slot: "morning" },
    { id: "4", status: "taken", slot: "evening" },
  ];

  const result = calculateAdherence(sampleHistory, 7);
  assert.equal(result.takenCount, 3);
  assert.equal(result.totalCount, 4);
  assert.equal(result.percentage, 75);
  assert.equal(result.streak, 1);
});

test("adherence: calculates 100% adherence and full streak on perfect record", () => {
  const perfectHistory = [
    { id: "1", status: "taken", slot: "morning" },
    { id: "2", status: "taken", slot: "afternoon" },
    { id: "3", status: "taken", slot: "evening" },
    { id: "4", status: "taken", slot: "night" },
  ];

  const result = calculateAdherence(perfectHistory, 7);
  assert.equal(result.percentage, 100);
  assert.equal(result.streak, 4);
});

test("adherence: streaks reset to 0 immediately upon missed dose", () => {
  const brokenHistory = [
    { id: "1", status: "taken", slot: "morning" },
    { id: "2", status: "taken", slot: "evening" },
    { id: "3", status: "missed", slot: "morning" },
  ];

  const result = calculateAdherence(brokenHistory, 7);
  assert.equal(result.streak, 0);
  assert.equal(result.percentage, 67);
});

test("adherence: identifies most missed part of day for caregiver insights", () => {
  const patterns = [
    { id: "1", status: "missed", slot: "evening" },
    { id: "2", status: "taken", slot: "morning" },
    { id: "3", status: "missed", slot: "evening" },
    { id: "4", status: "missed", slot: "evening" },
    { id: "5", status: "missed", slot: "afternoon" },
  ];

  const analysis = analyzeMostMissedSlot(patterns);
  assert.equal(analysis.worstSlot, "evening");
  assert.equal(analysis.maxMissed, 3);
  assert.equal(analysis.breakdown.evening, 3);
  assert.equal(analysis.breakdown.morning, 0);
});

test("adherence: handles empty dose history safely without NaN or division by zero", () => {
  const empty = calculateAdherence([], 7);
  assert.equal(empty.percentage, 100);
  assert.equal(empty.streak, 0);
  assert.equal(empty.takenCount, 0);
  assert.equal(empty.totalCount, 0);
});

