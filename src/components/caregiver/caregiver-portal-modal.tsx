"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, X, Pill, Bell, Sparkles } from "lucide-react";

interface CaregiverPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  language: "hi" | "en";
}

interface MedicationItem {
  id: string;
  name: string;
  time: string;
  dosage: string;
  taken: boolean;
}

export function CaregiverPortalModal({
  isOpen,
  onClose,
  isDark,
  language,
}: CaregiverPortalModalProps) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Medication Schedule State
  const [meds, setMeds] = useState<MedicationItem[]>([
    { id: "1", name: "Telmisartan", dosage: "40mg", time: "09:00 AM", taken: true },
    { id: "2", name: "Metformin", dosage: "500mg", time: "01:30 PM", taken: false },
    { id: "3", name: "Calcium D3", dosage: "500mg", time: "09:00 PM", taken: false },
  ]);

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

  const toggleMedTaken = (id: string) => {
    setMeds((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    );
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

  const takenCount = meds.filter((m) => m.taken).length;
  const adherencePct = Math.round((takenCount / meds.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
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
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {language === "hi" ? "पारिवारिक देखभाल पोर्टल" : "Caregiver & Family Portal"}
              </h3>
              <p className="text-[10px] text-zinc-500">
                {language === "hi" ? "पासकोड सुरक्षित (DPDP 2023 मानक)" : "Passcode Protected (DPDP 2023)"}
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
                : "Secure passcode access required to protect senior health records (Demo PIN: 1234)."}
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
                  {language === "hi" ? "दवा अनुपालन दर (Adherence)" : "Medication Adherence"}
                </span>
                <span className="text-xs font-bold text-emerald-400">
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
              <p className="text-[10px] text-zinc-500 mt-2">
                👵 प्रभा देवी (72 वर्ष) • 7-दिन की निरंतर स्ट्रीक
              </p>
            </div>

            {/* Medication Schedule Management */}
            <div className="rounded-2xl border border-zinc-800 bg-[#1c1c22] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Pill className="size-4 text-rose-400" />
                  <h5 className="text-xs font-bold">
                    {language === "hi" ? "आज की दवाइयां व खुराक" : "Today's Schedule"}
                  </h5>
                </div>
                <span className="text-[10px] text-zinc-500">{takenCount}/{meds.length} पूरी</span>
              </div>

              <div className="flex flex-col gap-2">
                {meds.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMedTaken(m.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      m.taken
                        ? "bg-emerald-950/20 border-emerald-800/40 text-zinc-200"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${m.taken ? "line-through text-zinc-400" : "text-zinc-100"}`}>
                          {m.name} {m.dosage}
                        </span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md">
                          {m.time}
                        </span>
                      </div>
                    </div>
                    {m.taken ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full">
                        {language === "hi" ? "बाकी" : "Pending"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rust-Powered LASA Drug Safety Checker */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-amber-400" />
                <h5 className="text-xs font-bold text-amber-200">
                  {language === "hi" ? "Rust LASA ड्रग सेफ्टी गार्ड" : "Rust-Powered LASA Safety Engine"}
                </h5>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">
                {language === "hi"
                  ? "समान नाम वाली खतरनाक दवाइयों (Look-Alike Sound-Alike) का सब-मिलीसेकंड सत्यापन।"
                  : "Zero-latency phonetic verification to prevent look-alike drug errors."}
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={safetyDrug}
                  onChange={(e) => setSafetyDrug(e.target.value)}
                  placeholder="उदा. Metformin या Valsartan"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:outline-hidden"
                />
                <button
                  onClick={handleCheckSafety}
                  disabled={isCheckingSafety || !safetyDrug.trim()}
                  className="rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  {isCheckingSafety ? "..." : language === "hi" ? "जांचें" : "Verify"}
                </button>
              </div>

              {safetyResult && (
                <div className="mt-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  {safetyResult.alerts.length > 0 ? (
                    safetyResult.alerts.map((alert, i) => (
                      <div key={i} className="flex flex-col gap-1 text-rose-300">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="size-3.5 text-rose-500" />
                          <span>{alert.severity} LASA Overlap ({alert.similarityScore}%)</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          समान नाम: <span className="text-amber-300 font-semibold">{alert.conflictingDrug}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400">{alert.clinicalRisk}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="size-3.5" />
                      <span>सुरक्षित: कोई गंभीर LASA टकराव नहीं मिला। ({safetyResult.latencyMs}ms)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Proactive Caregiver Alert Channels */}
            <div className="rounded-2xl border border-zinc-800 bg-[#1c1c22] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="size-4 text-rose-400" />
                <div>
                  <h6 className="text-xs font-bold">{language === "hi" ? "एसएमएस व ईमेल अलर्ट" : "Proactive Alerts"}</h6>
                  <p className="text-[10px] text-zinc-500">प्रशांत (बेटा) • +91 98765 43210</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                सक्रिय (Active)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
