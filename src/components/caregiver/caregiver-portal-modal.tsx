"use client";

import React, { useEffect, useState } from "react";
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, X, Pill, Bell, Sparkles, Plus, Calendar, Trash2, Stethoscope, Activity } from "lucide-react";
import { formatAppointmentDate, type Medication, type Appointment, type DoseRecord } from "@/lib/medication-store";

interface CaregiverPortalModalProps {
  syncStatus: "local" | "connected" | "error";
  doseRecords: DoseRecord[];
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  language: "hi" | "en";
  meds: Medication[];
  onUpdateMed: (id: string, changes: Partial<Pick<Medication, "name" | "dosage" | "time" | "instructions">>) => void;
  onRemoveMed: (id: string) => void;
  onAddMed: (med: Omit<Medication, "id" | "taken" | "takenAt" | "doseStatus">) => void;
  appts: Appointment[];
  onAddAppt: (appt: Omit<Appointment, "id" | "status">) => void;
  onUpdateAppt: (id: string, changes: Partial<Omit<Appointment, "id">>) => void;
  adherencePct: number;
  takenCount: number;
  onOpenVisitBrief?: (appt: Appointment) => void;
}

export function CaregiverPortalModal({
  syncStatus,
  doseRecords,
  isOpen,
  onClose,
  isDark,
  language,
  meds,
  onUpdateMed,
  onRemoveMed,
  onAddMed,
  appts,
  onAddAppt,
  onUpdateAppt,
  adherencePct,
  takenCount,
  onOpenVisitBrief,
}: CaregiverPortalModalProps) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  // Add Med Form Toggle & State
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedTime, setNewMedTime] = useState("02:00 PM");
  const [newMedInstructions, setNewMedInstructions] = useState("");

  // Add Appointment Form State
  const [isAddingAppt, setIsAddingAppt] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newHospital, setNewHospital] = useState("");
  const [newApptDate, setNewApptDate] = useState("2026-11-16");
  const [newApptTime, setNewApptTime] = useState("11:00 AM");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewApptDate(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`);
  }, []);

  // Drug Safety Rust Check State
  const [safetyDrug, setSafetyDrug] = useState("");
  const [safetyResult, setSafetyResult] = useState<{
    safe: boolean;
    alerts: Array<{
      drugEntered: string;
      conflictingDrug: string;
      similarityScore: number;
      severity: string;
      clinicalRisk: string;
      engine: string;
    }>;
    executionEngine: string;
    latencyMs: number;
  } | null>(null);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);

  const [historyDays, setHistoryDays] = useState<Array<{ day: string; sub: string; status: string; count: string }>>([]);
  useEffect(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const count = doseRecords.filter((record) => record.date === key && record.status === "TAKEN").length;
      return { day: new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", { weekday: "short" }).format(date), sub: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date), status: index === 6 ? "today" : count > 0 ? "complete" : "empty", count: count ? `${count} taken` : "0" };
    });
    // Date-dependent data is computed after hydration so the build cannot freeze today's date.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistoryDays(days);
  }, [doseRecords, language]);

  if (!isOpen) return null;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingCode(true);
    try {
      const response = await fetch("/api/family-state/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode: pin }) });
      if (response.ok) {
        sessionStorage.setItem("sakhi_family_sync_code", pin);
        window.dispatchEvent(new Event("sakhi:connect-family"));
        setIsAuthenticated(true);
        setErrorMsg("");
      } else if (response.status === 503 && pin === "1234") {
        setIsAuthenticated(true);
        setErrorMsg("");
      } else {
        setErrorMsg(language === "hi" ? "परिवार कोड अमान्य है।" : "Invalid family code.");
        setPin("");
      }
    } catch { setErrorMsg(language === "hi" ? "कोड जाँच उपलब्ध नहीं है।" : "Could not verify the family code."); }
    finally { setIsCheckingCode(false); }
  };

  const handleCreateMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    onAddMed({
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || "1 गोली",
      time: newMedTime,
      instructions: newMedInstructions.trim() || "भोजन के बाद",
    });
    setNewMedName("");
    setNewMedDosage("");
    setNewMedInstructions("");
    setIsAddingMed(false);
  };

  const handleCreateAppt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName.trim()) return;
    onAddAppt({
      doctorName: newDoctorName.trim(),
      specialty: newSpecialty.trim() || "जनरल फिजिशियन",
      hospital: newHospital.trim() || "सिटी क्लिनिक",
      date: newApptDate,
      time: newApptTime,
    });
    setNewDoctorName("");
    setNewSpecialty("");
    setNewHospital("");
    setIsAddingAppt(false);
  };

  const handleCheckSafety = async () => {
    if (!safetyDrug.trim()) return;
    setIsCheckingSafety(true);
    try {
      const res = await fetch("/api/safety/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugName: safetyDrug }),
      });
      const data = await res.json();
      setSafetyResult(data);
    } catch {
      // Fallback
    } finally {
      setIsCheckingSafety(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col overflow-hidden bg-[#161619] text-zinc-100 select-none animate-in fade-in duration-200">
      {/* Top Embedded Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 shrink-0 bg-[#161619]/95 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/60 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
          >
            <span>← {language === "hi" ? "साथी" : "Companion"}</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>{language === "hi" ? "केयरगिवर पोर्टल" : "Caregiver Portal"}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Scrollable Portal Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* 1. Passcode Gate Screen */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-amber-400 mb-4 shadow-inner">
              <Lock className="size-7" />
            </div>
            <h4 className="text-base font-bold tracking-tight mb-1">
              {language === "hi" ? "परिवार कोड दर्ज करें" : "Enter Family Code"}
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mb-5">
              {language === "hi"
                ? "साझा डेटा के लिए परिवार कोड दर्ज करें। स्थानीय डेमो के लिए 1234 इस्तेमाल करें।"
                : "Enter your configured family code for shared data. For local-only demo mode, use 1234."}
            </p>

            <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs">
              <input
                type="password"
                maxLength={128}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="• • • •"
                className="w-40 text-center tracking-[0.5em] text-2xl font-bold rounded-2xl border border-zinc-700 bg-zinc-900/80 py-2.5 text-white focus:outline-hidden focus:border-rose-500"
                autoFocus
              />
              {errorMsg && <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>}

              <button
                type="submit"
                disabled={!pin || isCheckingCode}
                className="mt-2 w-full rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                {language === "hi" ? "सुरक्षित लॉगिन करें" : "Unlock Portal"}
              </button>
            </form>
          </div>
        ) : (
          /* 2. Authenticated Dashboard */
          <div className="flex flex-col gap-4 mt-4">
            <p className={`rounded-xl border px-3 py-2 text-xs ${syncStatus === "connected" ? "border-emerald-700 text-emerald-300" : "border-amber-700 text-amber-300"}`}>
              {syncStatus === "connected" ? "Shared schedule connected. Background reminders can use saved data." : syncStatus === "error" ? "Shared schedule could not connect. Changes are only in this browser; background reminders are off." : "Local demo data. Configure shared storage for background reminders."}
            </p>
            {/* Senior Adherence Summary: 7-Day Sanjeevani Health Rhythm */}
            <div className="rounded-2xl border border-zinc-800 bg-[#1c1c22] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="size-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    {language === "hi" ? "सप्त-दिन स्वास्थ्य चक्र (7-Day Health Rhythm)" : "7-Day Health Rhythm & Adherence"}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${adherencePct >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                  {adherencePct}% {adherencePct >= 75 ? "Optimal" : "Attention"}
                </span>
              </div>

              {/* 7 Daily Rhythm Badges */}
              <div className="grid grid-cols-7 gap-1.5 py-1">
                {historyDays.map((d, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all ${
                      d.status === "today"
                        ? "border-amber-400/80 bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/50"
                        : d.status === "complete"
                        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900/40 text-zinc-500 border-dashed"
                    }`}
                  >
                    <span className="text-[10px] font-bold">{language === "hi" ? d.day : d.sub}</span>
                    <div className="my-1">
                      {d.status === "complete" ? (
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      ) : d.status === "today" ? (
                        <div className="size-3.5 rounded-full border-2 border-amber-400 animate-pulse flex items-center justify-center">
                          <div className="size-1 bg-amber-400 rounded-full" />
                        </div>
                      ) : (
                        <div className="size-3.5 rounded-full border border-zinc-700" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400">{d.count}</span>
                  </div>
                ))}
              </div>

              <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    adherencePct >= 75 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${adherencePct}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400">Counts come from recorded doses in the last seven days.</p>
            </div>

            {/* Medication Schedule Management */}
            <div className="rounded-2xl border border-zinc-800 bg-[#1c1c22] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Pill className="size-4 text-rose-400" />
                  <h5 className="text-xs font-bold text-zinc-100">
                    {language === "hi" ? "दवाइयों का शेड्यूल" : "Medication Schedule"}
                  </h5>
                </div>
                <button
                  onClick={() => setIsAddingMed(!isAddingMed)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>{isAddingMed ? "रद्द करें" : "दवा जोड़ें"}</span>
                </button>
              </div>

              {/* Add Med Inline Form */}
              {isAddingMed && (
                <form onSubmit={handleCreateMed} className="mb-3 p-3 rounded-xl border border-zinc-700 bg-zinc-900/90 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="दवा का नाम (उदा. Aspirin)"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="डोज़ (75mg)"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="समय (उदा. 02:00 PM)"
                      value={newMedTime}
                      onChange={(e) => setNewMedTime(e.target.value)}
                      className="w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="निर्देश (भोजन के बाद)"
                      value={newMedInstructions}
                      onChange={(e) => setNewMedInstructions(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-rose-600 hover:bg-rose-500 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    शेड्यूल में जोड़ें
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-2">
                {meds.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
                      m.taken
                        ? "bg-emerald-950/20 border-emerald-800/40 text-zinc-200"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100">
                          {m.name} {m.dosage}
                        </span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded-md">
                          {m.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{m.instructions}</p>
                    </div>
                    {m.doseStatus === "TAKEN" ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${m.doseStatus === "SKIPPED" ? "border-rose-500/40 bg-rose-950/30 text-rose-300" : "border-amber-500/40 bg-amber-950/30 text-amber-300"}`}>
                        {m.doseStatus === "SKIPPED" ? "Not taken" : language === "hi" ? "बाकी" : "Pending"}
                      </span>
                    )}
                    <details className="relative">
                      <summary className="list-none cursor-pointer rounded-lg bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200">Edit</summary>
                      <form className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-zinc-700 bg-zinc-950 p-3 shadow-xl" onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        onUpdateMed(m.id, { name: String(form.get("name")), dosage: String(form.get("dosage")), time: String(form.get("time")), instructions: String(form.get("instructions")) });
                      }}>
                        <div className="flex flex-col gap-2">
                          <input name="name" aria-label="Medicine name" defaultValue={m.name} className="rounded-lg bg-zinc-900 px-2 py-1.5 text-xs" required />
                          <input name="dosage" aria-label="Dosage" defaultValue={m.dosage} className="rounded-lg bg-zinc-900 px-2 py-1.5 text-xs" />
                          <input name="time" aria-label="Scheduled time" defaultValue={m.time} className="rounded-lg bg-zinc-900 px-2 py-1.5 text-xs" />
                          <input name="instructions" aria-label="Instructions" defaultValue={m.instructions} className="rounded-lg bg-zinc-900 px-2 py-1.5 text-xs" />
                          <button className="rounded-lg bg-rose-600 py-1.5 text-xs font-semibold text-white">Save schedule</button>
                          <button type="button" onClick={() => onRemoveMed(m.id)} className="flex items-center justify-center gap-1 rounded-lg border border-rose-900 py-1.5 text-xs text-rose-300"><Trash2 className="size-3" />Remove medicine</button>
                        </div>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Doctor Appointments */}
            <div className="rounded-2xl border border-zinc-800 bg-[#1c1c22] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-rose-400" />
                  <h5 className="text-xs font-bold text-zinc-100">
                    {language === "hi" ? "आगामी डॉक्टर परामर्श" : "Upcoming Doctor Appointments"}
                  </h5>
                </div>
                <button
                  onClick={() => setIsAddingAppt(!isAddingAppt)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>{isAddingAppt ? "रद्द करें" : "जोड़ें"}</span>
                </button>
              </div>

              {isAddingAppt && (
                <form onSubmit={handleCreateAppt} className="mb-3 p-3 rounded-xl border border-zinc-700 bg-zinc-900/90 flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="डॉक्टर का नाम (उदा. डॉ. आर. के. गुप्ता)"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="विभाग (Cardiology)"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="अस्पताल (Max Saket)"
                      value={newHospital}
                      onChange={(e) => setNewHospital(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      placeholder="दिनांक (कल)"
                      value={newApptDate}
                      onChange={(e) => setNewApptDate(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="समय (10:30 AM)"
                      value={newApptTime}
                      onChange={(e) => setNewApptTime(e.target.value)}
                      className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-rose-600 hover:bg-rose-500 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    अपॉइंटमेंट सेव करें
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-2">
                {appts.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">{a.doctorName}</span>
                      <span className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-900/60 px-2 py-0.5 rounded-full">
                        {formatAppointmentDate(a.date, language)} - {a.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{a.specialty}</p>
                        <p className="text-[10px] text-zinc-500">{a.hospital}</p>
                      </div>
                      {onOpenVisitBrief && (
                        <button
                          type="button"
                          onClick={() => onOpenVisitBrief(a)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 transition-all cursor-pointer shadow-xs"
                          title="Generate Clinical Doctor Brief"
                        >
                          <Stethoscope className="size-3" />
                          <span>{language === "hi" ? "क्लीनिकल ब्रीफ" : "Clinical Brief"}</span>
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                      <span className="text-[10px] text-zinc-400 font-mono">{a.status}</span>
                      <input aria-label={`Reschedule ${a.doctorName}`} type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : ""} onChange={(event) => event.target.value && onUpdateAppt(a.id, { date: event.target.value, status: "RESCHEDULED" })} className="max-w-32 rounded-lg bg-zinc-950 px-2 py-1 text-[10px] text-zinc-200" />
                      {a.status !== "COMPLETED" && <button onClick={() => onUpdateAppt(a.id, { status: "COMPLETED" })} className="rounded-lg border border-emerald-800 px-2 py-1 text-[10px] text-emerald-300 cursor-pointer">Mark complete</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rust-Powered LASA Drug Safety Checker */}
            <div className="rounded-2xl border border-amber-500/40 bg-zinc-900/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="size-4 text-amber-400" />
                <h5 className="text-xs font-bold text-amber-300">
                  {language === "hi" ? "Rust LASA ड्रग सेफ्टी गार्ड" : "Rust-Powered LASA Safety Engine"}
                </h5>
              </div>
              <p className="text-[11px] text-zinc-300 mb-3 leading-relaxed">
                {language === "hi"
                  ? "समान नाम वाली खतरनाक दवाइयों (Look-Alike Sound-Alike) का सब-मिलीसेकंड सत्यापन।"
                  : "Zero-latency native Rust verification to prevent look-alike drug errors."}
              </p>

              <div className="flex gap-2">
                <input
                  id="tour-safety-input"
                  type="text"
                  value={safetyDrug}
                  onChange={(e) => setSafetyDrug(e.target.value)}
                  placeholder="उदा. Metformin या Valsartan"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
                />
                <button
                  onClick={handleCheckSafety}
                  disabled={isCheckingSafety || !safetyDrug.trim()}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                >
                  {isCheckingSafety ? "..." : language === "hi" ? "जांचें" : "Verify"}
                </button>
              </div>

              {safetyResult && (
                <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                  {safetyResult.alerts.length > 0 ? (
                    safetyResult.alerts.map((alert, i) => (
                      <div key={i} className="flex flex-col gap-1 text-rose-300">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400">
                          <AlertTriangle className="size-3.5 text-rose-500 shrink-0" />
                          <span>{alert.severity} LASA Overlap ({alert.similarityScore}%)</span>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          समान नाम: <span className="text-amber-300 font-bold">{alert.conflictingDrug}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 leading-normal">{alert.clinicalRisk}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3.5" />
                      <span>सुरक्षित: कोई गंभीर LASA टकराव नहीं मिला। ({safetyResult.latencyMs}ms)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Proactive Caregiver Alert Channels (WhatsApp & SMS) */}
            <div className="rounded-2xl border border-zinc-800 bg-[#1c1c22] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell className="size-4 text-rose-400" />
                  <div>
                    <h6 className="text-xs font-bold text-zinc-100">
                {language === "hi" ? "देखभाल सूचना" : "Caregiver notifications"}
                    </h6>
                    <p className="text-[10px] text-zinc-400">Local demo profile</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  Provider setup required
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                {language === "hi"
                  ? "इस डेमो में कोई WhatsApp या SMS नहीं भेजा जाता है।"
                  : "With provider keys configured, upcoming doses and visits send email reminders while this app is open. Missed doses can also place a caregiver call."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
