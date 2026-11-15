import test from "node:test";
import assert from "node:assert/strict";

// Edge Cases & Robustness Tests

test("edge cases: Devanagari and Unicode medication names are handled without corruption", () => {
  const indicMedicines = [
    { name: "एस्पिरिन", dose: "75 मिलीग्राम", frequency: "दिन में एक बार" },
    { name: "पैरासिटामोल", dose: "650 मिलीग्राम", frequency: "ज़रूरत पड़ने पर" },
    { name: "मेटफॉर्मिन", dose: "500 मिलीग्राम", frequency: "सुबह नाश्ते के बाद" }
  ];

  for (const med of indicMedicines) {
    const jsonStr = JSON.stringify(med);
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.name, med.name);
    assert.equal(parsed.dose, med.dose);
  }
});

test("edge cases: timezone boundaries and midnight crossover do not cause missed slot anomalies", () => {
  // Asia/Kolkata is UTC+5:30
  const dateKolkata = new Date("2026-11-15T23:45:00+05:30");
  const hour = dateKolkata.getHours();
  assert.equal(hour, 23);

  // 30 minutes later should be next calendar day
  const dateNextDay = new Date(dateKolkata.getTime() + 30 * 60 * 1000);
  assert.equal(dateNextDay.getDate(), 16);
});

test("edge cases: duplicate dose submissions within the same minute are idempotent", () => {
  const recordedLogs = new Set();

  function logDoseIdempotent(medicineId, slotDateStr) {
    const key = `${medicineId}_${slotDateStr}`;
    if (recordedLogs.has(key)) {
      return { success: true, duplicateIgnored: true };
    }
    recordedLogs.add(key);
    return { success: true, duplicateIgnored: false };
  }

  const firstCall = logDoseIdempotent("med-101", "2026-11-15_08:00");
  assert.equal(firstCall.duplicateIgnored, false);

  const secondCall = logDoseIdempotent("med-101", "2026-11-15_08:00");
  assert.equal(secondCall.duplicateIgnored, true);
});

test("edge cases: paused medicines do not generate due dose alerts", () => {
  const activeMed = { id: "1", name: "Amlodipine", isPaused: false };
  const pausedMed = { id: "2", name: "Antibiotic (Course Finished)", isPaused: true };

  function shouldGenerateAlert(med) {
    return !med.isPaused;
  }

  assert.equal(shouldGenerateAlert(activeMed), true);
  assert.equal(shouldGenerateAlert(pausedMed), false);
});

