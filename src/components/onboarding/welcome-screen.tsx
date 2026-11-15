"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, HeartHandshake, Mic, ArrowRight, CheckCircle2 } from "lucide-react";

interface WelcomeScreenProps {
  onStartDemo: (withTour: boolean) => void;
  language: "hi" | "en";
}

export function WelcomeScreen({ onStartDemo, language }: WelcomeScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [enableTour, setEnableTour] = useState(true);

  const steps = language === "hi"
    ? [
        "प्रभा देवी (72 वर्ष) का स्वास्थ्य प्रोफाइल लोड हो रहा है...",
        "Rust LASA ड्रग सेफ्टी इंजन प्रारंभ हो रहा है...",
        "सखी द्विभाषी वॉयस कंपेनियन सक्रिय हो रहा है...",
      ]
    : [
        "Loading Prabha Devi (72 yrs) health circle...",
        "Initializing native Rust LASA drug safety engine...",
        "Connecting Sakhi bilingual voice companion...",
      ];

  const handleStart = () => {
    setIsLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(() => {
            onStartDemo(enableTour);
          }, 450);
          return prev;
        }
      });
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#121214] p-6 sm:p-8 text-zinc-100 shadow-2xl">
        {/* Top Glow & Badge */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 size-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
              स
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">सखी • Sakhi</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Live Demo
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {language === "hi" ? "बुजुर्गों की देखभाल एवं दवा साथी" : "Elderly Care & Medication Companion"}
              </p>
            </div>
          </div>
          <div className="size-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Hero Title & Pitch */}
        <div className="my-6 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {language === "hi" ? (
              <>
                दवाइयां, डॉक्टर और परिवार —{" "}
                <span className="text-emerald-400">एक सरल आवाज़ में।</span>
              </>
            ) : (
              <>
                Medicines, visits, and care circle —{" "}
                <span className="text-emerald-400">in one gentle voice.</span>
              </>
            )}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {language === "hi"
              ? "दादी के लिए स्क्रीन टाइपिंग नहीं, बल्कि सीधी सहज बातचीत। परिवार के लिए DPDP-संरक्षित पारदर्शी अपडेट्स और Rust-पावर्ड दवा सुरक्षा।"
              : "Built elder-first for Indian seniors who struggle with complex smartphone apps. Powered by real-time bilingual voice, native Rust drug safety, and caregiver loops."}
          </p>
        </div>

        {/* 3 Pillars Highlights */}
        <div className="grid grid-cols-3 gap-2.5 my-6 text-center">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
            <Mic className="size-5 text-emerald-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-zinc-200">Voice-First</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Gnani + LiveKit</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
            <ShieldCheck className="size-5 text-amber-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-zinc-200">Rust LASA</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">&lt;0.1ms Engine</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
            <HeartHandshake className="size-5 text-sky-400 mx-auto mb-1.5" />
            <div className="text-xs font-semibold text-zinc-200">Care Circle</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">PIN 2026 Guard</div>
          </div>
        </div>

        {/* Loading Progress State or Launch Button */}
        {isLoading ? (
          <div className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <Sparkles className="size-4 animate-spin text-emerald-400" />
              <span>{steps[loadingStep]}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Interactive Tour Toggle Checkbox */}
            <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={enableTour}
                  onChange={(e) => setEnableTour(e.target.checked)}
                  className="size-4 rounded accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-zinc-300 font-medium">
                  {language === "hi"
                    ? "इंटरैक्टिव इवैल्यूएटर टूर चालू रखें (अनुशंसित)"
                    : "Enable Interactive Evaluator Tour (Recommended)"}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">5 Steps</span>
            </label>

            {/* Launch Button */}
            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 px-4 text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
            >
              <span>{language === "hi" ? "डेमो शुरू करें (कोई साइन-अप नहीं)" : "Start the Demo, No Sign-up"}</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
