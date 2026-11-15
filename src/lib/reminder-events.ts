import type { SharedHealthState } from "./server-health-state";
import type { AlertType, AlertChannel } from "./notification-delivery";

export interface ReminderEvent { key: string; type: AlertType; details: string; channel: AlertChannel }

function parts(date: Date, timeZone: string) {
  const values = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const item = (name: string) => Number(values.find((part) => part.type === name)?.value);
  return { year: item("year"), month: item("month"), day: item("day"), hour: item("hour"), minute: item("minute") };
}

function clock(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3]) hour = (hour % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export function reminderEvents(state: SharedHealthState, now = new Date(), timeZone = "Asia/Kolkata"): ReminderEvent[] {
  const local = parts(now, timeZone);
  const today = `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
  const minuteOfDay = local.hour * 60 + local.minute;
  const events: ReminderEvent[] = [];
  for (const med of state.medications) {
    if (["1", "2", "3"].includes(med.id)) continue; // Built-in tour examples are never scheduled.
    if (state.doses.some((record) => record.medicationId === med.id && record.date === today)) continue;
    const time = clock(med.time);
    if (!time) continue;
    const minutes = time.hour * 60 + time.minute - minuteOfDay;
    if (minutes >= 0 && minutes <= 15) events.push({ key: `dose-upcoming:${today}:${med.id}`, type: "DOSE_UPCOMING", details: `${med.name} ${med.dosage} is due at ${med.time}.`, channel: "email" });
    if (minutes <= -45 && minutes >= -75) events.push({ key: `dose-missed:${today}:${med.id}`, type: "DOSE_MISSED", details: `${med.name} ${med.dosage} has not been marked taken since ${med.time}.`, channel: "both" });
  }
  for (const appt of state.appointments) {
    if (["1", "2"].includes(appt.id) || appt.status !== "UPCOMING") continue;
    const time = clock(appt.time);
    if (!time || !/^\d{4}-\d{2}-\d{2}$/.test(appt.date)) continue;
    const [year, month, day] = appt.date.split("-").map(Number);
    const dateIndex = Date.UTC(year, month - 1, day);
    const todayIndex = Date.UTC(local.year, local.month - 1, local.day);
    const minutes = (dateIndex - todayIndex) / 60000 + time.hour * 60 + time.minute - minuteOfDay;
    if (minutes > 0 && minutes <= 24 * 60) events.push({ key: `appointment:${appt.id}:${appt.date}:${appt.time}`, type: "APPOINTMENT_UPCOMING", details: `Appointment with ${appt.doctorName} at ${appt.hospital} on ${appt.date} at ${appt.time}.`, channel: "email" });
  }
  return events;
}
