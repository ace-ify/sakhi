"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, X, Pill, Bell, Sparkles, Plus, Calendar, Trash2 } from "lucide-react";
import { formatAppointmentDate, type Medication, type Appointment } from "@/lib/medication-store";

interface CaregiverPortalModalProps {
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
}

export function CaregiverPortalModal({
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
}: CaregiverPortalModalProps) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [newApptDate, setNewApptDate] = useState(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`);
  const [newApptTime, setNewApptTime] = useState("11:00 AM");

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

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      setIsAuthenticated(true);
      setErrorMsg("");
    } else {
      setErrorMsg(language === "hi" ? "गलत पासकोड! (डिफ़ॉल्ट: 1234)" : "Invalid Passcode! (Default: 1234)");
      setPin("");
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div
        className={`relative z-10 flex w-full max-w-[420px] flex-col max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 animate-in zoom-in-95 duration-200 ${
          isDark
            ? "bg-[#161619] border-zinc-800 text-zinc-100"
            : "bg-white border-stone-200 text-stone-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {language === "hi" ? "पारिवारिक देखभाल पोर्टल" : "Caregiver & Family Portal"}
              </h3>
              <p className="text-[10px] text-zinc-400">
                {language === "hi" ? "डेमो पासकोड" : "Demo passcode · local demo data"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 1. Passcode Gate Screen */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-amber-400 mb-4 shadow-inner">
              <Lock className="size-7" />
            </div>
            <h4 className="text-base font-bold tracking-tight mb-1">
              {language === "hi" ? "4-अंकों का पासकोड दर्ज करें" : "Enter 4-Digit Passcode"}
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mb-5">
              {language === "hi"
                ? "वरिष्ठ नागरिक का स्वास्थ्य डेटा सुरक्षित रखने के लिए पासकोड अनिवार्य है (परीक्षण कोड: 1234)।"
                : "Demo gate for this prototype (PIN: 1234). Health data is stored in this browser."}
            </p>

            <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • •"
                className="w-40 text-center tracking-[0.5em] text-2xl font-bold rounded-2xl border border-zinc-700 bg-zinc-900/80 py-2.5 text-white focus:outline-hidden focus:border-rose-500"
                autoFocus
              />
              {errorMsg && <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>}

              <button
                type="submit"
                disabled={pin.length !== 4}
                className="mt-2 w-full rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                {language === "hi" ? "सुरक्षित लॉगिन करें" : "Unlock Portal"}
              </button>
            </form>
          </div>
        ) : (
          /* 2. Authenticated Dashboard */
          <div className="flex flex-col gap-4 mt-4">
            {/* Senior Adherence Summary */}
            <div className="rounded-2xl border border-zinc-800 bg-[#1c1c22] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-400">
                  {language === "hi" ? "दवा अनुपालन दर (Live Adherence)" : "Live Medication Adherence"}
                </span>
                <span className={`text-xs font-bold ${adherencePct >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                  {adherencePct}% {adherencePct >= 75 ? "Optimal" : "Attention Needed"}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    adherencePct >= 75 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${adherencePct}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-2">
                👵 प्रभा देवी (72 वर्ष) • {takenCount}/{meds.length} दवाइयां पूरी
              </p>
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
                  <div key={a.id} className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">{a.doctorName}</span>
                      <span className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-900/60 px-2 py-0.5 rounded-full">
                        {formatAppointmentDate(a.date, language)} - {a.time}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{a.specialty}</p>
                    <p className="text-[10px] text-zinc-500">{a.hospital}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-400">{a.status}</span>
                      <input aria-label={`Reschedule ${a.doctorName}`} type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : ""} onChange={(event) => event.target.value && onUpdateAppt(a.id, { date: event.target.value, status: "RESCHEDULED" })} className="max-w-32 rounded-lg bg-zinc-950 px-2 py-1 text-[10px] text-zinc-200" />
                      {a.status !== "COMPLETED" && <button onClick={() => onUpdateAppt(a.id, { status: "COMPLETED" })} className="rounded-lg border border-emerald-800 px-2 py-1 text-[10px] text-emerald-300">Mark complete</button>}
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
                  Demo only
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                {language === "hi"
                  ? "इस डेमो में कोई WhatsApp या SMS नहीं भेजा जाता है।"
                  : "No WhatsApp or SMS is sent in this demo phase."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
