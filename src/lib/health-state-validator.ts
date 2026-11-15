import type { Appointment, DoseRecord, Medication } from "./medication-store";

export interface SharedHealthState {
  medications: Medication[];
  appointments: Appointment[];
  doses: DoseRecord[];
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid health record");
  return value as Record<string, unknown>;
}

function field(value: unknown, name: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`Invalid ${name}`);
  return value.trim();
}

function optionalField(value: unknown, name: string, max = 200): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > max) throw new Error(`Invalid ${name}`);
  return value.trim();
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:(?:0?[1-9]|1[0-2]):[0-5]\d\s*(?:AM|PM)|(?:[01]?\d|2[0-3]):[0-5]\d)$/i;

export function validateSharedHealthState(input: unknown): SharedHealthState {
  const data = record(input);
  if (!Array.isArray(data.medications) || data.medications.length > 100 || !Array.isArray(data.appointments) || data.appointments.length > 100 || !Array.isArray(data.doses) || data.doses.length > 10_000) throw new Error("Invalid health lists");
  const medications = data.medications.map((value): Medication => {
    const med = record(value);
    const time = field(med.time, "medicine time", 20);
    if (!timePattern.test(time)) throw new Error("Invalid medicine time");
    const doseStatus = optionalField(med.doseStatus, "dose status");
    if (doseStatus && doseStatus !== "TAKEN" && doseStatus !== "SKIPPED") throw new Error("Invalid dose status");
    return { id: field(med.id, "medicine id", 100), name: field(med.name, "medicine name"), dosage: field(med.dosage, "dosage"), time, instructions: optionalField(med.instructions, "instructions", 500) ?? "", taken: med.taken === true, takenAt: optionalField(med.takenAt, "taken time"), doseStatus: doseStatus as Medication["doseStatus"] };
  });
  const appointments = data.appointments.map((value): Appointment => {
    const appt = record(value);
    const date = field(appt.date, "appointment date", 10);
    const time = field(appt.time, "appointment time", 20);
    if (!datePattern.test(date) || !timePattern.test(time)) throw new Error("Invalid appointment date or time");
    const status = field(appt.status, "appointment status");
    if (status !== "UPCOMING" && status !== "COMPLETED" && status !== "RESCHEDULED") throw new Error("Invalid appointment status");
    return { id: field(appt.id, "appointment id", 100), doctorName: field(appt.doctorName, "doctor name"), specialty: optionalField(appt.specialty, "specialty") ?? "", hospital: optionalField(appt.hospital, "hospital") ?? "", date, time, status };
  });
  const doses = data.doses.map((value): DoseRecord => {
    const dose = record(value);
    const date = field(dose.date, "dose date", 10);
    if (!datePattern.test(date)) throw new Error("Invalid dose date");
    if (dose.status !== "TAKEN" && dose.status !== "SKIPPED") throw new Error("Invalid dose status");
    const recordedAt = field(dose.recordedAt, "recorded time", 40);
    if (!Number.isFinite(Date.parse(recordedAt))) throw new Error("Invalid recorded time");
    return { id: field(dose.id, "dose id", 120), medicationId: field(dose.medicationId, "dose medicine id", 100), date, status: dose.status, recordedAt };
  });
  return { medications, appointments, doses };
}
