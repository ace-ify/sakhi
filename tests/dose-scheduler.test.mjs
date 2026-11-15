import test from "node:test";
import assert from "node:assert/strict";

// Dose Scheduling and Grace Period Logic
function evaluateDoseStatus(scheduledTimeStr, isTaken, currentTimeStr, graceMinutes = 30) {
  if (isTaken) return { status: "TAKEN", label: "Completed" };

  const [sHours, sMins] = scheduledTimeStr.split(":").map(Number);
  const [cHours, cMins] = currentTimeStr.split(":").map(Number);

  const scheduledMinutes = sHours * 60 + sMins;
  const currentMinutes = cHours * 60 + cMins;

  if (currentMinutes <= scheduledMinutes) {
    return { status: "UPCOMING", label: "Due Soon" };
  } else if (currentMinutes <= scheduledMinutes + graceMinutes) {
    return { status: "DUE_NOW", label: "Pending Take" };
  } else {
    return { status: "MISSED", label: "Missed Dose - Alert Caregiver" };
  }
}

// Appointment Conflict Detection Logic
function hasAppointmentConflict(existingAppts, newApptDate, newApptTime) {
  return existingAppts.some(
    (appt) => appt.date === newApptDate && appt.time === newApptTime && appt.status === "UPCOMING"
  );
}

test("1. Dose Scheduler: should mark dose DUE_NOW within 30-minute grace period", () => {
  const result = evaluateDoseStatus("09:00", false, "09:15", 30);
  assert.equal(result.status, "DUE_NOW");
});

test("2. Dose Scheduler: should transition unconfirmed dose to MISSED after grace period", () => {
  const result = evaluateDoseStatus("09:00", false, "09:45", 30);
  assert.equal(result.status, "MISSED");
  assert.ok(result.label.includes("Alert Caregiver"));
});

test("3. Dose Scheduler: confirmed dose remains TAKEN regardless of time", () => {
  const result = evaluateDoseStatus("09:00", true, "10:30", 30);
  assert.equal(result.status, "TAKEN");
});

test("4. Appointment Conflict: prevents duplicate booking for same date and time slot", () => {
  const appts = [
    { id: "1", date: "2026-11-16", time: "10:30 AM", status: "UPCOMING" },
  ];
  assert.equal(hasAppointmentConflict(appts, "2026-11-16", "10:30 AM"), true);
  assert.equal(hasAppointmentConflict(appts, "2026-11-16", "02:00 PM"), false);
});

