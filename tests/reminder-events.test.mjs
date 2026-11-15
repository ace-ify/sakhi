import test from "node:test";
import assert from "node:assert/strict";
import { reminderEvents } from "../src/lib/reminder-events.ts";

test("schedules real upcoming and missed doses, skips recorded and tour doses", () => {
  const state = {
    medications: [
      { id: "real-upcoming", name: "A", dosage: "1mg", time: "09:10 AM" },
      { id: "real-missed", name: "B", dosage: "2mg", time: "08:00 AM" },
      { id: "recorded", name: "C", dosage: "3mg", time: "08:00 AM" },
      { id: "1", name: "Tour", dosage: "4mg", time: "09:10 AM" },
    ],
    appointments: [],
    doses: [{ medicationId: "recorded", date: "2026-11-15", status: "TAKEN" }],
  };
  const events = reminderEvents(state, new Date("2026-11-15T03:30:00.000Z"));
  assert.deepEqual(events.map(({ key, channel }) => [key, channel]), [
    ["dose-upcoming:2026-11-15:real-upcoming", "email"],
    ["dose-missed:2026-11-15:real-missed", "both"],
  ]);
});

test("schedules a real appointment once inside its 24-hour window", () => {
  const state = { medications: [], doses: [], appointments: [
    { id: "real", doctorName: "Doctor", hospital: "Clinic", date: "2026-11-16", time: "08:30 AM", status: "UPCOMING" },
    { id: "1", doctorName: "Tour", hospital: "Demo", date: "2026-11-16", time: "08:30 AM", status: "UPCOMING" },
  ] };
  assert.deepEqual(reminderEvents(state, new Date("2026-11-15T03:30:00.000Z")).map((event) => event.key), ["appointment:real:2026-11-16:08:30 AM"]);
});
