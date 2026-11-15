"use client";

import { useEffect, useState } from "react";

export type DoseStatus = "TAKEN" | "SKIPPED";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  instructions: string;
  taken: boolean;
  takenAt?: string;
  doseStatus?: DoseStatus;
}

export interface DoseRecord {
  id: string;
  medicationId: string;
  date: string;
  status: DoseStatus;
  recordedAt: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  status: "UPCOMING" | "COMPLETED" | "RESCHEDULED";
}

const DEFAULT_MEDS: Medication[] = [
  { id: "1", name: "Telmisartan", dosage: "40mg", time: "09:00 AM", instructions: "After breakfast with water", taken: true, takenAt: "09:12 AM", doseStatus: "TAKEN" },
  { id: "2", name: "Metformin", dosage: "500mg", time: "01:30 PM", instructions: "After lunch", taken: false },
  { id: "3", name: "Calcium D3", dosage: "500mg", time: "09:00 PM", instructions: "Before bed with milk", taken: false },
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

const DEFAULT_APPTS: Appointment[] = [
  { id: "1", doctorName: "Dr. Arvind Sharma", specialty: "Cardiology", hospital: "Max Hospital, Saket", date: "2026-11-16", time: "10:30 AM", status: "UPCOMING" },
  { id: "2", doctorName: "Dr. Meenakshi Iyer", specialty: "Ophthalmology", hospital: "Apollo Clinic", date: "2026-11-18", time: "04:00 PM", status: "UPCOMING" },
];

const MEDS_KEY = "sakhi_medications_v1";
const APPTS_KEY = "sakhi_appointments_v1";
const DOSES_KEY = "sakhi_dose_records_v1";

function safeRead<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the in-memory demo usable when browser storage is unavailable.
  }
}

function normalizeAppointmentDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/tomorrow|कल/i.test(value)) return dateAfter(1);
  const dayAndMonth = value.match(/(\d{1,2})\s*(?:नवंबर|नवम्बर|nov(?:ember)?)/i);
  if (dayAndMonth) return `2026-11-${dayAndMonth[1].padStart(2, "0")}`;
  return value;
}

export function formatAppointmentDate(value: string, language: "hi" | "en" = "en") {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function withTodayStatus(medications: Medication[], records: DoseRecord[]) {
  const today = localDateKey();
  return medications.map((medication) => {
    const record = records.find((item) => item.medicationId === medication.id && item.date === today);
    return {
      ...medication,
      taken: record?.status === "TAKEN",
      doseStatus: record?.status,
      takenAt: record?.status === "TAKEN"
        ? new Date(record.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : undefined,
    };
  });
}

export function useSharedHealthData() {
  const [meds, setMeds] = useState<Medication[]>(DEFAULT_MEDS);
  const [appts, setAppts] = useState<Appointment[]>(DEFAULT_APPTS);
  const [doseRecords, setDoseRecords] = useState<DoseRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"local" | "connected" | "error">("local");

  useEffect(() => {
    const savedMeds = safeRead<Medication[]>(MEDS_KEY) ?? DEFAULT_MEDS;
    const savedAppts = safeRead<Appointment[]>(APPTS_KEY) ?? DEFAULT_APPTS;
    const storedDoses = safeRead<DoseRecord[]>(DOSES_KEY);
    const today = localDateKey();
    // Migrate the previous single-boolean record once, retaining today's existing demo state.
    const records = storedDoses ?? savedMeds.flatMap((medication) =>
      medication.taken
        ? [{ id: `${today}:${medication.id}`, medicationId: medication.id, date: today, status: "TAKEN" as const, recordedAt: new Date().toISOString() }]
        : [],
    );
    // Load browser-only localStorage after hydration, as recommended for Client Components.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoseRecords(records);
    setMeds(withTodayStatus(savedMeds, records));
    setAppts(savedAppts.map((appointment) => ({ ...appointment, date: normalizeAppointmentDate(appointment.date) })));
    if (!storedDoses) save(DOSES_KEY, records);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const connect = async () => {
      const passcode = sessionStorage.getItem("sakhi_family_sync_code");
      if (!passcode) return;
      try {
        const response = await fetch("/api/family-state", { headers: { "x-family-passcode": passcode }, cache: "no-store" });
        if (!response.ok) { setSyncStatus("error"); return; }
        const payload = await response.json();
        if (payload.state) {
          const state = payload.state as { medications: Medication[]; appointments: Appointment[]; doses: DoseRecord[] };
          setMeds(withTodayStatus(state.medications, state.doses));
          setAppts(state.appointments);
          setDoseRecords(state.doses);
          save(MEDS_KEY, state.medications);
          save(APPTS_KEY, state.appointments);
          save(DOSES_KEY, state.doses);
        } else {
          const saved = await fetch("/api/family-state", { method: "PUT", headers: { "Content-Type": "application/json", "x-family-passcode": passcode }, body: JSON.stringify({ medications: meds, appointments: appts, doses: doseRecords }) });
          if (!saved.ok) throw new Error("Shared storage unavailable");
        }
        setSyncReady(true);
        setSyncStatus("connected");
      } catch { setSyncStatus("error"); }
    };
    void connect();
    window.addEventListener("sakhi:connect-family", connect);
    return () => window.removeEventListener("sakhi:connect-family", connect);
  // Connect once on hydration or after the caregiver unlocks the portal.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    if (!syncReady) return;
    const passcode = sessionStorage.getItem("sakhi_family_sync_code");
    if (!passcode) return;
    const timer = setTimeout(() => {
      void fetch("/api/family-state", { method: "PUT", headers: { "Content-Type": "application/json", "x-family-passcode": passcode }, body: JSON.stringify({ medications: meds, appointments: appts, doses: doseRecords }) }).then((response) => setSyncStatus(response.ok ? "connected" : "error")).catch(() => setSyncStatus("error"));
    }, 300);
    return () => clearTimeout(timer);
  }, [meds, appts, doseRecords, syncReady]);

  const persistMeds = (next: Medication[]) => {
    setMeds(next);
    save(MEDS_KEY, next);
  };

  const markDose = (id: string, status: DoseStatus) => {
    const now = new Date();
    const record: DoseRecord = {
      id: `${localDateKey(now)}:${id}`,
      medicationId: id,
      date: localDateKey(now),
      status,
      recordedAt: now.toISOString(),
    };
    const nextRecords = [...doseRecords.filter((item) => item.id !== record.id), record];
    setDoseRecords(nextRecords);
    save(DOSES_KEY, nextRecords);
    persistMeds(withTodayStatus(meds, nextRecords));
  };

  const addMedication = (medication: Omit<Medication, "id" | "taken" | "takenAt" | "doseStatus">) => {
    persistMeds(withTodayStatus([...meds, { ...medication, id: crypto.randomUUID(), taken: false }], doseRecords));
  };

  const addMedications = (items: Omit<Medication, "id" | "taken" | "takenAt" | "doseStatus">[]) => {
    persistMeds(withTodayStatus([...meds, ...items.map((item) => ({ ...item, id: crypto.randomUUID(), taken: false }))], doseRecords));
  };

  const updateMedication = (id: string, changes: Partial<Omit<Medication, "id" | "taken" | "takenAt" | "doseStatus">>) => {
    persistMeds(meds.map((medication) => medication.id === id ? { ...medication, ...changes } : medication));
  };

  const removeMedication = (id: string) => {
    persistMeds(meds.filter((medication) => medication.id !== id));
    const nextRecords = doseRecords.filter((record) => record.medicationId !== id);
    setDoseRecords(nextRecords);
    save(DOSES_KEY, nextRecords);
  };

  const persistAppts = (next: Appointment[]) => {
    setAppts(next);
    save(APPTS_KEY, next);
  };

  const addAppointment = (appointment: Omit<Appointment, "id" | "status">) => {
    persistAppts([...appts, { ...appointment, date: normalizeAppointmentDate(appointment.date), id: crypto.randomUUID(), status: "UPCOMING" }]);
  };

  const updateAppointment = (id: string, changes: Partial<Omit<Appointment, "id">>) => {
    persistAppts(appts.map((appointment) => appointment.id === id
      ? { ...appointment, ...changes, date: changes.date ? normalizeAppointmentDate(changes.date) : appointment.date }
      : appointment));
  };

  const takenCount = meds.filter((medication) => medication.doseStatus === "TAKEN").length;
  const adherencePct = meds.length ? Math.round((takenCount / meds.length) * 100) : 100;

  return {
    meds,
    appts,
    doseRecords,
    isLoaded,
    syncStatus,
    markDose,
    addMedication,
    addMedications,
    updateMedication,
    removeMedication,
    addAppointment,
    updateAppointment,
    takenCount,
    adherencePct,
  };
}
