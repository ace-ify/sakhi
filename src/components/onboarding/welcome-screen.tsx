"use client";

import React from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";

interface WelcomeScreenProps {
  onStartDemo: (withTour: boolean) => void;
  language: "hi" | "en";
}

export function WelcomeScreen({ onStartDemo, language }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#141417] p-6 text-zinc-100 shadow-2xl">
        {/* Subtle Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 size-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
              स
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">सखी • Sakhi</h2>
              <p className="text-[10px] text-zinc-400">
                {language === "hi" ? "बुजुर्ग स्वास्थ्य साथी" : "Elderly Care Companion"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onStartDemo(false)}
            aria-label="Close welcome screen"
            className="rounded-full p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Minimal Message */}
        <div className="my-5 space-y-1.5">
          <h3 className="text-base font-bold text-white">
            {language === "hi" ? "इंटरैक्टिव टूर गाइड" : "Interactive Tour Guide"}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {language === "hi"
              ? "ऐप के सभी प्रमुख फीचर्स देखने के लिए टूर शुरू करें, या सीधे मुख्य स्क्रीन पर जाएं।"
              : "Take a quick walkthrough of the voice companion, medication loop, and caregiver portal, or jump straight to the app."}
          </p>
        </div>

        {/* Two Clean Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => onStartDemo(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 px-4 text-xs transition-all shadow-md shadow-emerald-500/15 active:scale-[0.99] cursor-pointer"
          >
            <Sparkles className="size-3.5 text-zinc-950" />
            <span>{language === "hi" ? "टूर शुरू करें" : "Start Guided Tour"}</span>
            <ArrowRight className="size-3.5" />
          </button>

          <button
            onClick={() => onStartDemo(false)}
            data-testid="skip-tour"
            className="w-full flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium py-2.5 px-4 text-xs transition-colors cursor-pointer"
          >
            <span>{language === "hi" ? "टूर छोड़ें (सीधे ऐप देखें)" : "Skip Tour (Go to App)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
