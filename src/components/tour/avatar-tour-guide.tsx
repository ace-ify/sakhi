"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X, RotateCcw, Volume2, VolumeX, CheckCircle2 } from "lucide-react";

export interface AvatarTourStep {
  id: number;
  title: string;
  hindiTitle: string;
  avatarMood: "greeting" | "pointing" | "explaining" | "celebrating";
  dialogueHi: string;
  dialogueEn: string;
  actionLabelHi: string;
  actionLabelEn: string;
  targetDescription: string;
  completed: boolean;
}

interface AvatarTourGuideProps {
  currentStep: number;
  completedSteps: Record<number, boolean>;
  onStepSelect: (stepId: number) => void;
  onExecuteAction: (stepId: number) => void;
  onCloseTour: () => void;
  onResetTour: () => void;
  language: "hi" | "en";
}

export function AvatarTourGuide({
  currentStep,
  completedSteps,
  onStepSelect,
  onExecuteAction,
  onCloseTour,
  onResetTour,
  language,
}: AvatarTourGuideProps) {
  const [speechMuted, setSpeechMuted] = useState(false);
  const [isAvatarBouncing, setIsAvatarBouncing] = useState(false);

  const steps: AvatarTourStep[] = [
    {
      id: 1,
      title: "Voice Check-in with Dadi",
      hindiTitle: "दादी से वॉयस बातचीत",
      avatarMood: "greeting",
      dialogueHi: "नमस्ते! मैं सखी हूँ। बुजुर्गों को जटिल ऐप नहीं समझ आते। नीचे दिए गए माइक पर बोलिए या 'सुबह की बीपी दवा' पर टैप कीजिए—दादी सीधे आवाज़ से बात कर सकती हैं!",
      dialogueEn: "Namaste! I'm Sakhi. Seniors struggle with complex apps. Tap the voice prompt below or speak into the mic—Dadi interacts directly via voice!",
      actionLabelHi: "आवाज़ में पूछकर देखें",
      actionLabelEn: "Try Voice Interaction",
      targetDescription: "Voice Orb & Quick Prompts",
      completed: !!completedSteps[1],
    },
    {
      id: 2,
      title: "Confirm Morning Dose",
      hindiTitle: "सुबह की दवा पुष्टि",
      avatarMood: "pointing",
      dialogueHi: "देखिए, स्क्रीन पर 'टेल्मिसर्टन 40mg' की खुराक का रिमाइंडर है। दादी या परिवार बस 'ले ली' दबाएंगे और रिकॉर्ड तुरंत अपडेट हो जाएगा।",
      dialogueEn: "Notice the morning reminder for 'Telmisartan 40mg'. Dadi or family simply taps 'Taken' to update the shared record.",
      actionLabelHi: "दवा 'ले ली' दर्ज करें",
      actionLabelEn: "Confirm Morning Dose",
      targetDescription: "Due Dose Card on Screen",
      completed: !!completedSteps[2],
    },
    {
      id: 3,
      title: "DPDP Passcode Caregiver Portal",
      hindiTitle: "देखभालकर्ता पोर्टल (पिन 2026)",
      avatarMood: "explaining",
      dialogueHi: "परिवार और देखभालकर्ता के लिए अलग सुरक्षित पोर्टल है। यह 4-अंकीय पिन '2026' (DPDP 2023 अधिनियम) से सुरक्षित है। चलिए अंदर चलते हैं!",
      dialogueEn: "Family members have their own portal protected by 4-digit PIN '2026' (DPDP Act 2023 compliant). Let's unlock it!",
      actionLabelHi: "केयरगिवर टैब खोलें",
      actionLabelEn: "Switch to Caregiver Tab",
      targetDescription: "Caregiver Tab (PIN 2026)",
      completed: !!completedSteps[3],
    },
    {
      id: 4,
      title: "Rust LASA Drug Safety",
      hindiTitle: "रस्ट दवा सुरक्षा सत्यापन",
      avatarMood: "pointing",
      dialogueHi: "बुजुर्ग अक्सर एक जैसे नाम वाली दवाइयों में गलती कर बैठते हैं। हमारा नेटिव रस्ट इंजन 0.1ms में फोनेटिक दूरी नापकर 'Valsartan' और 'Telmisartan' का ओवरलैप पकड़ लेता है!",
      dialogueEn: "Seniors frequently confuse look-alike drugs. Our native compiled Rust engine checks phonetic similarity in 0.1ms to prevent dangerous duplicate dosing!",
      actionLabelHi: "रस्ट सेफ्टी टेस्ट करें",
      actionLabelEn: "Run Rust Safety Test",
      targetDescription: "Rust LASA Checker",
      completed: !!completedSteps[4],
    },
    {
      id: 5,
      title: "Doctor Clinical Brief",
      hindiTitle: "डॉक्टर विजिट क्लीनिकल ब्रीफ",
      avatarMood: "celebrating",
      dialogueHi: "शाबाश! कल डॉक्टर अरविंद शर्मा से मिलने का समय है। जेमिनी AI और 7-दिन के दवा रिकॉर्ड से तैयार संकलित क्लीनिकल ब्रीफ देखिए—डॉक्टर को सब स्पष्ट पता रहेगा!",
      dialogueEn: "Splendid! For tomorrow's cardiology visit with Dr. Sharma, check the synthesized visit brief—adherence, missed doses, and doctor discussion points!",
      actionLabelHi: "क्लीनिकल ब्रीफ देखें",
      actionLabelEn: "View Clinical Brief",
      targetDescription: "Appointments > Clinical Brief",
      completed: !!completedSteps[5],
    },
  ];

  const current = steps.find((s) => s.id === currentStep) || steps[0];
  const completedCount = steps.filter((s) => s.completed).length;

  // Speak dialogue aloud when step changes (if unmuted)
  useEffect(() => {
    setIsAvatarBouncing(true);
    const timeout = setTimeout(() => setIsAvatarBouncing(false), 700);

    if (!speechMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = language === "hi" ? current.dialogueHi : current.dialogueEn;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }

    return () => clearTimeout(timeout);
  }, [currentStep, language, speechMuted]);

  return (
    <div className="w-full lg:w-[350px] xl:w-[390px] shrink-0 text-zinc-100 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="relative rounded-3xl border border-emerald-500/30 bg-[#141418]/95 backdrop-blur-2xl p-5 shadow-2xl shadow-emerald-950/40 space-y-4">
        {/* Subtle Ambient Guide Aura */}
        <div className="absolute -top-10 -left-10 size-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header with Progress & Audio Toggle */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40">
              <Sparkles className="size-3.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">सखी टूर गाइड • Sakhi Guide</h3>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                {completedCount}/5 Loops Mastered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (!speechMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setSpeechMuted((m) => !m);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title={speechMuted ? "Unmute Guide Voice" : "Mute Guide Voice"}
            >
              {speechMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-emerald-400" />}
            </button>
            <button
              onClick={onCloseTour}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Tour"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* AVATAR + SPEECH BUBBLE COMPANION */}
        <div className="flex items-start gap-3 pt-1">
          {/* Animated Illustrated Indian Avatar */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div
              className={`size-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-300 p-0.5 shadow-lg shadow-emerald-500/20 transition-transform duration-300 ${
                isAvatarBouncing ? "scale-110 -rotate-3" : "scale-100"
              }`}
            >
              <div className="size-full rounded-[14px] bg-[#121215] flex items-center justify-center overflow-hidden relative">
                {/* Avatar Graphic */}
                <span className="text-2xl select-none">
                  {current.avatarMood === "celebrating" ? "🎉" : current.avatarMood === "pointing" ? "👉" : "🧕"}
                </span>
                {/* Active Speaking Pulse indicator */}
                <div className="absolute bottom-1 right-1 size-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>
            <span className="text-[9px] font-bold text-emerald-400 mt-1 uppercase tracking-wider">
              Sakhi
            </span>
          </div>

          {/* Chat Speech Bubble */}
          <div className="relative flex-1 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 p-3.5 shadow-sm text-xs leading-relaxed text-zinc-200">
            {/* Speech bubble pointer notch */}
            <div className="absolute top-4 -left-1.5 size-3 bg-zinc-900 border-l border-t border-zinc-700/80 -rotate-45" />

            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center justify-between">
              <span>Step {current.id} of 5: {language === "hi" ? current.hindiTitle : current.title}</span>
              {current.completed && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <CheckCircle2 className="size-3" /> Done
                </span>
              )}
            </div>

            <p className="text-zinc-200">
              {language === "hi" ? current.dialogueHi : current.dialogueEn}
            </p>
          </div>
        </div>

        {/* TARGET HIGHLIGHT BADGE */}
        <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <span className="text-zinc-400">Focus Target:</span>
          <span className="text-emerald-300 font-medium font-mono">{current.targetDescription}</span>
        </div>

        {/* DYNAMIC ACTION DRIVER */}
        <button
          onClick={() => onExecuteAction(current.id)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 px-4 text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
        >
          <span>{language === "hi" ? current.actionLabelHi : current.actionLabelEn}</span>
          <ArrowRight className="size-4" />
        </button>

        {/* Step Navigation Pills & Reset */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
          <button
            onClick={() => onStepSelect(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex gap-1.5">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => onStepSelect(s.id)}
                className={`size-6 rounded-full text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  currentStep === s.id
                    ? "bg-emerald-500 text-zinc-950 scale-110 shadow-sm"
                    : s.completed
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s.completed ? "✓" : s.id}
              </button>
            ))}
          </div>

          <button
            onClick={() => onStepSelect(Math.min(steps.length, currentStep + 1))}
            disabled={currentStep === steps.length}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
