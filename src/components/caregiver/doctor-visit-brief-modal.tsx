"use client";

import React, { useState } from "react";
import { X, Stethoscope, Printer, FileText, Sparkles, Calendar, Clock, MapPin } from "lucide-react";
import type { Appointment, Medication } from "@/lib/medication-store";

interface DoctorVisitBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  meds: Medication[];
  adherencePct: number;
  isDark: boolean;
  language: "hi" | "en";
}

export function DoctorVisitBriefModal({
  isOpen,
  onClose,
  appointment,
  meds,
  adherencePct,
  isDark,
  language,
}: DoctorVisitBriefModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `Sakhi Clinical Visit Brief:
Patient: Prabha Devi (72 yrs)
Doctor: ${appointment.doctorName} (${appointment.specialty})
Hospital: ${appointment.hospital}
Time: ${appointment.date} at ${appointment.time}
7-Day Adherence: ${adherencePct}%
Active Meds: ${meds.map((m) => `${m.name} ${m.dosage}`).join(", ")}
Notes: Patient reported morning lightheadedness; evaluate BP dose titration.`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 shadow-2xl transition-colors ${
          isDark ? "bg-[#161618] border-zinc-800 text-zinc-100" : "bg-white border-stone-200 text-stone-900"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {language === "hi" ? "डॉक्टर विजिट क्लीनिकल ब्रीफ" : "Clinical Doctor Visit Brief"}
                </h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Ready to Share
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {language === "hi" ? "डॉक्टर को दिखाने हेतु संकलित स्वास्थ्य रिपोर्ट" : "Synthesized health summary for the physician"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Doctor & Appointment Details */}
        <div className="my-5 rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm text-zinc-100">{appointment.doctorName}</div>
            <span className="text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-md bg-emerald-500/10">
              {appointment.specialty}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-zinc-500" />
              {appointment.hospital}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-zinc-500" />
              {appointment.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5 text-zinc-500" />
              {appointment.time}
            </span>
          </div>
        </div>

        {/* Adherence & Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl p-3.5 bg-zinc-900/40 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">7-Day Adherence</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{adherencePct}%</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">7-Day consecutive streak</div>
          </div>
          <div className="rounded-2xl p-3.5 bg-zinc-900/40 border border-zinc-800">
            <div className="text-[11px] text-zinc-400">Prescription Verification</div>
            <div className="text-xl font-bold text-sky-400 mt-1">100%</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Rust LASA Checked</div>
          </div>
        </div>

        {/* Current Active Regimen */}
        <div className="space-y-2 mb-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {language === "hi" ? "सक्रिय दवाइयाँ" : "Active Medications"}
          </div>
          <div className="space-y-1.5">
            {meds.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs"
              >
                <div>
                  <span className="font-semibold text-zinc-200">{m.name}</span>
                  <span className="ml-2 text-zinc-400">{m.dosage}</span>
                </div>
                <div className="text-zinc-500 text-[11px]">{m.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gemini-Drafted Clinical Discussion Points */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Sparkles className="size-4" />
            <span>{language === "hi" ? "डॉक्टर से चर्चा के प्रमुख बिंदु (Gemini AI)" : "Key Talking Points for Physician (Gemini AI)"}</span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300 list-disc list-inside">
            <li>
              <strong>Lightheadedness Observation:</strong> Patient noted slight orthostatic dizziness after morning dose on Thursday. Consider sitting vs standing BP check.
            </li>
            <li>
              <strong>Metformin Tolerance:</strong> Consistent glycemic routine maintained; check latest fasting glucose.
            </li>
            <li>
              <strong>Winter Hydration:</strong> Senior water intake recorded slightly low; encourage scheduled hydration reminders.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
          >
            <FileText className="size-3.5" />
            <span>{isCopied ? "Copied!" : "Copy Summary"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 cursor-pointer shadow-md"
          >
            <Printer className="size-3.5" />
            <span>{language === "hi" ? "प्रिंट / PDF निकालें" : "Print / Export Brief"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

