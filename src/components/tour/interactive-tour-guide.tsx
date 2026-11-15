"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, X, Sparkles, Shield, Mic, Pill, Stethoscope, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

export interface TourStep {
  id: number;
  title: string;
  hindiTitle: string;
  tagline: string;
  description: string;
  actionLabel: string;
  targetHint: string;
  completed: boolean;
}

interface InteractiveTourGuideProps {
  currentStep: number;
  completedSteps: Record<number, boolean>;
  onStepSelect: (stepId: number) => void;
  onExecuteAction: (stepId: number) => void;
  onCloseTour: () => void;
  onResetTour: () => void;
  language: "hi" | "en";
}

export function InteractiveTourGuide({
  currentStep,
  completedSteps,
  onStepSelect,
  onExecuteAction,
  onCloseTour,
  onResetTour,
  language,
}: InteractiveTourGuideProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const steps: TourStep[] = [
    {
      id: 1,
      title: "Voice Check-in with Dadi",
      hindiTitle: "दादी से वॉयस बातचीत",
      tagline: "Natural Vernacular Voice Companion",
      description: language === "hi"
        ? "बुजुर्गों के लिए बिना टाइप किए सीधी बातचीत। सुबह की दवा का हाल पूछें।"
        : "Elderly seniors don't type. Experience the bilingual voice loop with Dadi.",
      actionLabel: language === "hi" ? "आवाज़ में पूछें" : "Trigger Voice Interaction",
      targetHint: "Voice Orb & Quick Prompts",
      completed: !!completedSteps[1],
    },
    {
      id: 2,
      title: "Medication Dose Loop",
      hindiTitle: "दवा की खुराक पुष्टि",
      tagline: "Single-Tap Morning Dose Confirmation",
      description: language === "hi"
        ? "टेल्मिसर्टन 40mg की खुराक नियत समय पर है। 'ले ली' बटन दबाकर पुष्टि करें।"
        : "Telmisartan 40mg is due. Confirming marks it across Dadi's screen and the Caregiver portal.",
      actionLabel: language === "hi" ? "दवा ले ली दर्ज करें" : "Confirm Morning Dose",
      targetHint: "Due Dose Banner on Screen",
      completed: !!completedSteps[2],
    },
    {
      id: 3,
      title: "DPDP Passcode Portal",
      hindiTitle: "देखभालकर्ता पोर्टल (पिन 2026)",
      tagline: "Family Caregiver Access Gate",
      description: language === "hi"
        ? "पारिवारिक देखभालकर्ता हेतु 4-अंकीय सुरक्षित पिन द्वार (DPDP अधिनियम 2023 अनुरूप)।"
        : "Senior health records protected by 4-digit PIN (2026) for family members.",
      actionLabel: language === "hi" ? "पोर्टल अनलॉक करें" : "Unlock Caregiver Portal",
      targetHint: "Top-left Menu > PIN 2026",
      completed: !!completedSteps[3],
    },
    {
      id: 4,
      title: "Rust LASA Safety Engine",
      hindiTitle: "रस्ट दवा सुरक्षा सत्यापन",
      tagline: "Sub-millisecond Phonetic Drug Overlap Check",
      description: language === "hi"
        ? "समान नाम वाली खतरनाक दवाओं (Valsartan vs Telmisartan) को शून्य-विलंबता Rust से जांचें।"
        : "Prevent look-alike sound-alike drug errors in <0.1ms using native compiled Rust.",
      actionLabel: language === "hi" ? "रस्ट सेफ्टी जांचें" : "Run Rust LASA Check",
      targetHint: "Drug Safety Input in Portal",
      completed: !!completedSteps[4],
    },
    {
      id: 5,
      title: "Doctor Clinical Brief",
      hindiTitle: "डॉक्टर विजिट क्लीनिकल ब्रीफ",
      tagline: "Gemini-Synthesized Physician Summary",
      description: language === "hi"
        ? "डॉक्टर अरविंद शर्मा की अपॉइंटमेंट के लिए 7-दिन का अनुपालन और प्रमुख क्लीनिकल बिंदु।"
        : "Synthesizes 7-day adherence, missed doses, and Gemini consultation points for Dr. Sharma.",
      actionLabel: language === "hi" ? "क्लीनिकल ब्रीफ देखें" : "Open Doctor Visit Brief",
      targetHint: "Appointment Card > Clinical Brief",
      completed: !!completedSteps[5],
    },
  ];

  const current = steps.find((s) => s.id === currentStep) || steps[0];
  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <aside
      aria-label="Interactive Evaluator Tour"
      className="w-full lg:w-[340px] xl:w-[380px] shrink-0 text-zinc-100 animate-in fade-in slide-in-from-left-4 duration-300"
    >
      <div className="rounded-3xl border border-zinc-800 bg-[#161619]/90 backdrop-blur-xl p-5 shadow-2xl space-y-4">
        {/* Tour Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              <Sparkles className="size-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Interactive Evaluator Tour</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {completedCount}/{steps.length} Done
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Live guided walk-through for judges</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized((m) => !m)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              title={isMinimized ? "Expand" : "Collapse"}
            >
              {isMinimized ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
            <button
              onClick={onCloseTour}
              className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 cursor-pointer"
              title="Close Tour"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        {!isMinimized && (
          <>
            {/* Step Selection Pills */}
            <div className="grid grid-cols-5 gap-1.5 py-1">
              {steps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onStepSelect(s.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    currentStep === s.id
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50"
                      : s.completed
                      ? "border-zinc-800 bg-zinc-900/60 text-zinc-300"
                      : "border-zinc-800/60 bg-zinc-900/30 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  {s.completed ? (
                    <CheckCircle2 className="size-4 text-emerald-400 mb-0.5" />
                  ) : (
                    <span className="text-xs font-bold font-mono">{s.id}</span>
                  )}
                  <span className="text-[9px] font-medium truncate w-full">
                    {s.id === 1 ? "Voice" : s.id === 2 ? "Dose" : s.id === 3 ? "PIN" : s.id === 4 ? "Rust" : "Brief"}
                  </span>
                </button>
              ))}
            </div>

            {/* Current Step Spotlight Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    Step {current.id} of {steps.length} • {current.tagline}
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {language === "hi" ? current.hindiTitle : current.title}
                  </h4>
                </div>
                {current.completed && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="size-3" />
                    Passed
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">{current.description}</p>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span className="text-zinc-500 font-mono">Target:</span>
                <span className="text-zinc-300 font-medium">{current.targetHint}</span>
              </div>

              {/* Dynamic Interactive Trigger Button */}
              <button
                onClick={() => onExecuteAction(current.id)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 px-3 text-xs transition-all shadow-md shadow-emerald-500/15 cursor-pointer active:scale-[0.99]"
              >
                <span>{current.actionLabel}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => onStepSelect(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={onResetTour}
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 cursor-pointer text-[11px]"
                title="Reset all tour steps"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => onStepSelect(Math.min(steps.length, currentStep + 1))}
                disabled={currentStep === steps.length}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

