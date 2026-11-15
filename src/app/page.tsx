"use client";

import React, { useCallback, useState, useEffect } from "react";
import LivingVoiceOrb from "@/components/ui/orb-bloop";
import type { VoiceState } from "@/types/voice";
import { Iphone16Pro } from "@/components/ui/iphone-16-pro";
import { AgentControlBar } from "@/components/agents-ui/agent-control-bar";
import { AgentChatTranscript, type TranscriptMessage } from "@/components/agents-ui/agent-chat-transcript";
import { AgentPopup } from "@/components/agents-ui/agent-popup";
import { PrescriptionReview } from "@/components/prescription-review";
import { CaregiverPortalModal } from "@/components/caregiver/caregiver-portal-modal";
import { formatAppointmentDate, useSharedHealthData, type Appointment } from "@/lib/medication-store";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { AvatarTourGuide } from "@/components/tour/avatar-tour-guide";
import { DoctorVisitBriefModal } from "@/components/caregiver/doctor-visit-brief-modal";
import {
  Menu,
  Globe,
  Sun,
  Moon,
  AlertTriangle,
  Calendar,
  Clock,
  SquarePen,
  ChevronDown,
  ChevronUp,
  FileText,
  Heart,
  X,
  Upload,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Compass,
} from "lucide-react";

// Claude Code-style rotating status words (pure language specific)
const THINKING_WORDS_HI = ["जांच जारी है...", "पर्चा समझ रहा हूँ...", "दवा मिला रहा हूँ...", "तैयार कर रहा हूँ..."];
const THINKING_WORDS_EN = ["Analyzing...", "Synthesizing...", "Verifying...", "Retrieving EHR..."];

export default function MobileVoiceApp() {
  // Theme state: dark / light
  const [isDark, setIsDark] = useState(true);
  const [isTransitioningTheme, setIsTransitioningTheme] = useState(false);

  // Language state: "hi" (Strict pure Hindi) | "en" (Strict pure English)
  const [language, setLanguage] = useState<"hi" | "en">("hi");

  // Call & Voice session states
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true); // Strictly MUTED by default until call connects!
  const [orbState, setOrbState] = useState<VoiceState>("idle");

  // Chat UI states: Text input vs Full Transcript
  const [isTextInputOpen, setIsTextInputOpen] = useState(false); // Controls only the text bar inside control bar
  const [isChatTranscriptOpen, setIsChatTranscriptOpen] = useState(false); // Controls the full message transcript

  // App Modals & history
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApptOpen, setIsApptOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCaregiverOpen, setIsCaregiverOpen] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [statusWordIndex, setStatusWordIndex] = useState(0);

  // Interactive Onboarding & Evaluator Tour States
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [showTour, setShowTour] = useState(true);
  const [currentTourStep, setCurrentTourStep] = useState(1);
  const [completedTourSteps, setCompletedTourSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });
  const [caregiverAutoAuth, setCaregiverAutoAuth] = useState(false);
  const [activeBriefAppt, setActiveBriefAppt] = useState<Appointment | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  // Unified Shared Health & Medication Store (Syncs Dadi screen & Caregiver Portal)
  const { meds, appts, doseRecords, syncStatus, markDose, addMedication, addMedications, updateMedication, removeMedication, addAppointment, updateAppointment, adherencePct, takenCount } = useSharedHealthData();
  const dueDose = meds.find((m) => !m.doseStatus);

  const handleExecuteTourAction = async (stepId: number) => {
    if (stepId === 1) {
      handleTrigger(
        language === "hi" ? "सुबह की बीपी दवा की स्थिति" : "Morning BP medication status",
        language === "hi"
          ? "आपकी टेल्मिसर्टन 40mg सुबह 9:00 बजे की थी। क्या आपने पानी के साथ ले ली?"
          : "Your Telmisartan 40mg was scheduled for 9:00 AM. Have you taken it with water?"
      );
      setCompletedTourSteps((prev) => ({ ...prev, 1: true }));
      setTimeout(() => setCurrentTourStep(2), 1800);
    } else if (stepId === 2) {
      if (dueDose) {
        markDose(dueDose.id, "TAKEN");
        handleTrigger(
          language === "hi" ? `${dueDose.name} ले ली` : `Took ${dueDose.name}`,
          language === "hi"
            ? `शाबाश दादी! मैंने दर्ज कर लिया है कि आपने ${dueDose.name} ले ली है।`
            : `Splendid Dadi! I recorded that you took your ${dueDose.name}.`
        );
      }
      setCompletedTourSteps((prev) => ({ ...prev, 2: true }));
      setTimeout(() => setCurrentTourStep(3), 1600);
    } else if (stepId === 3) {
      setCaregiverAutoAuth(true);
      setIsCaregiverOpen(true);
      setCompletedTourSteps((prev) => ({ ...prev, 3: true }));
      setTimeout(() => setCurrentTourStep(4), 1200);
    } else if (stepId === 4) {
      setCaregiverAutoAuth(true);
      setIsCaregiverOpen(true);
      try {
        await fetch("/api/safety/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drugName: "valsatarin" }),
        });
        const inputEl = document.getElementById("tour-safety-input") as HTMLInputElement | null;
        if (inputEl) inputEl.value = "valsatarin";
      } catch {}
      setCompletedTourSteps((prev) => ({ ...prev, 4: true }));
      setTimeout(() => setCurrentTourStep(5), 1800);
    } else if (stepId === 5) {
      const targetAppt = appts[0] || null;
      setActiveBriefAppt(targetAppt);
      setIsBriefModalOpen(true);
      setCompletedTourSteps((prev) => ({ ...prev, 5: true }));
    }
  };

  // Cycle Claude Code status words when thinking
  useEffect(() => {
    if (orbState === "thinking") {
      const interval = setInterval(() => {
        setStatusWordIndex((prev) => (prev + 1) % 4);
      }, 1400);
      return () => clearInterval(interval);
    }
  }, [orbState]);

  // Smooth 850ms theme transition
  const toggleTheme = () => {
    setIsTransitioningTheme(true);
    setIsDark((prev) => !prev);
    setTimeout(() => {
      setIsTransitioningTheme(false);
    }, 850);
  };

  // Start fresh chat / reset
  const startNewChat = () => {
    setMessages([]);
    setIsTextInputOpen(false);
    setIsChatTranscriptOpen(false);
    setIsCallConnected(false);
    setIsMicMuted(true); // Reset to muted
    setOrbState("idle");
  };

  // Minimalist single-line prompts (strict single language)
  const minimalPrompts = language === "hi"
    ? [
        { icon: "💊", text: "सुबह की बीपी दवा की स्थिति", reply: "आपकी टेल्मिसर्टन 40mg सुबह 9:00 बजे की थी। क्या आपने पानी के साथ ले ली?" },
        { icon: "🩺", text: "डॉक्टर शर्मा से मिलने का समय", reply: "डॉ. अरविंद शर्मा के साथ आपकी अपॉइंटमेंट कल सुबह 10:30 बजे मैक्स अस्पताल में है।" },
        { icon: "📋", text: "मौजूदा दवाइयों की सूची", reply: "आपके पर्चे में 3 दवाइयां हैं: टेल्मिसर्टन 40mg, मेटफॉर्मिन 500mg, और कैल्शियम डी3।" },
        { icon: "💧", text: "पानी और बीपी जांच का समय", reply: "दवा के बाद एक गिलास गुनगुना पानी पिएं। शाम 5 बजे बीपी जांच का समय है।" },
      ]
    : [
        { icon: "💊", text: "Morning BP medicine status", reply: "Your Telmisartan 40mg was scheduled at 9:00 AM. Did you take it with water?" },
        { icon: "🩺", text: "Dr. Sharma appointment time", reply: "Your cardiology visit with Dr. Arvind Sharma is tomorrow at 10:30 AM at Max Hospital." },
        { icon: "📋", text: "Current prescription list", reply: "You have 3 active meds: Telmisartan 40mg, Metformin 500mg, and Calcium D3." },
        { icon: "💧", text: "Hydration and BP check time", reply: "Please drink a glass of warm water. Your evening BP check is set for 5:00 PM." },
      ];

  // Spoken Audio Output via Web Speech Synthesis (TTS)
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.onstart = () => setOrbState("speaking");
      utterance.onend = () => setOrbState("idle");
      utterance.onerror = () => setOrbState("idle");
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Web Speech API Microphone Speech-To-Text (STT)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) return;

    let recognition: any = null;
    try {
      recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "hi" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setOrbState("listening");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          void handleSendMessage(transcript.trim());
        }
      };

      recognition.onerror = () => {
        if (orbState === "listening") setOrbState("idle");
      };

      recognition.onend = () => {
        if (orbState === "listening") setOrbState("idle");
      };

      if (isCallConnected && !isMicMuted) {
        recognition.start();
      }
    } catch {}

    return () => {
      if (recognition) {
        try { recognition.stop(); } catch {}
      }
    };
  }, [isCallConnected, isMicMuted, language]);

  // Execute a prompt or send text message
  const handleTrigger = (promptText: string, replyText: string) => {
    setIsTextInputOpen(true);
    setIsChatTranscriptOpen(true);
    setIsCallConnected(true);

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: TranscriptMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: promptText,
      time: timeStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    setOrbState("thinking");

    setTimeout(() => {
      setOrbState("speaking");
      const agentMsg: TranscriptMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      speakText(replyText);
    }, 900);
  };

  // Chat Button toggle logic:
  const handleToggleChatButton = () => {
    if (isChatTranscriptOpen) {
      setIsChatTranscriptOpen(false);
      setIsTextInputOpen(false);
    } else {
      if (messages.length > 0) {
        setIsChatTranscriptOpen(true);
        setIsTextInputOpen(true);
      } else {
        setIsTextInputOpen((prev) => !prev);
      }
    }
  };

  // Start Call (Right Button in Control Bar: CALL)
  const handleStartCall = () => {
    setIsCallConnected(true);
    setIsMicMuted(false);
    setOrbState("listening");

    // Auto demo reply if user stays quiet
    setTimeout(() => {
      if (isCallConnected && orbState === "listening") {
        handleTrigger(
          language === "hi" ? "नमस्ते, क्या आज की कोई दवा बाकी है?" : "Hello, any pending medication today?",
          language === "hi"
            ? "नमस्ते! सुबह की दवा पूरी हो चुकी है। अगली खुराक दोपहर 1:30 बजे मेटफॉर्मिन की है।"
            : "Hello! Morning BP medicine is recorded. Next dose is Metformin at 1:30 PM post lunch."
        );
      }
    }, 4000);
  };

  // End Call (Right Button in Control Bar: END)
  const handleEndCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsCallConnected(false);
    setIsMicMuted(true);
    setOrbState("idle");
  };

  // Toggle Mic (Left Button in Control Bar: Mic toggle)
  const handleToggleMic = () => {
    if (!isCallConnected) return;
    setIsMicMuted((prev) => !prev);
  };

  // Tap Orb Action:
  const handleOrbTap = () => {
    if (!isCallConnected) {
      handleStartCall();
    } else {
      handleToggleMic();
    }
  };

  // Send query typed in Control Bar -> connected to live Google Gemini / Groq NLP!
  const handleSendMessage = async (text: string) => {
    setIsTextInputOpen(true);
    setIsChatTranscriptOpen(true);
    setIsCallConnected(true);

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: TranscriptMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: timeStr,
    };
    setMessages((prev) => [...prev, userMsg]);
    setOrbState("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language }),
      });
      const data = await res.json();
      const reply = data.reply || (language === "hi" ? "जी दादी, मैंने दर्ज कर लिया है।" : "Yes Dadi, recorded.");

      setOrbState("speaking");
      const agentMsg: TranscriptMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);
      speakText(reply);
    } catch {
      setOrbState("idle");
    }
  };

  // SOS Emergency Alert
  const sendCareAlert = useCallback(async (type: string, details: string, channel: "email" | "call" | "both" = "both") => {
    try {
      const response = await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, details, channel }) });
      const result = await response.json();
      return response.ok && result.success;
    } catch { return false; }
  }, []);

  const triggerEmergency = async () => {
    setOrbState("emergency_active");
    const sent = await sendCareAlert("SOS_EMERGENCY", "Emergency SOS triggered on Sakhi elderly device.");
    alert(sent ? "Caregiver alert accepted by a configured provider." : "Alert could not be sent. Please call your caregiver directly.");
  };

  // Get Claude Code-style Status Word
  const getStatusWord = () => {
    if (orbState === "thinking") {
      return language === "hi"
        ? THINKING_WORDS_HI[statusWordIndex]
        : THINKING_WORDS_EN[statusWordIndex];
    }
    if (orbState === "listening") return language === "hi" ? "सुन रहा हूँ..." : "Listening...";
    if (orbState === "speaking") return language === "hi" ? "बोल रहा हूँ..." : "Speaking...";
    if (orbState === "emergency_active" || orbState === "emergency_countdown") return language === "hi" ? "आपातकाल..." : "Emergency...";
    return language === "hi" ? "तैयार..." : "Ready...";
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#09090b] bg-editorial-pattern p-0 sm:p-4 overflow-hidden select-none">
      {/* Background Subtle Ambient Wave Lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
        <svg className="absolute -left-20 top-1/4 w-[140%] text-white/10" viewBox="0 0 1200 120" fill="none">
          <path d="M0 60 Q 150 0, 300 60 T 600 60 T 900 60 T 1200 60" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* DESKTOP WORKSPACE: Side-by-Side Flex Layout (Tour Guide in Left Space, Phone Centered) */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-6xl px-2 sm:px-4 py-2">
        {/* DESKTOP SIDE: Interactive Evaluator Tour Guide with Animated Avatar */}
        {showTour && (
          <div className="hidden lg:block shrink-0">
            <AvatarTourGuide
              currentStep={currentTourStep}
              completedSteps={completedTourSteps}
              onStepSelect={(id) => setCurrentTourStep(id)}
              onExecuteAction={handleExecuteTourAction}
              onCloseTour={() => setShowTour(false)}
              onResetTour={() => {
                setCompletedTourSteps({ 1: false, 2: false, 3: false, 4: false, 5: false });
                setCurrentTourStep(1);
              }}
              language={language}
            />
          </div>
        )}

        {/* CENTRAL PHONE CONTAINER: Clean, Modern, Sleek Smartphone Frame */}
        <div
          className={`relative z-10 flex h-[100dvh] max-h-none sm:h-[880px] sm:max-h-[92vh] w-full max-w-full sm:max-w-[420px] flex-col overflow-hidden rounded-none sm:rounded-[40px] sm:border sm:border-zinc-800/80 shadow-2xl transition-colors duration-500 mx-auto ${
            isDark ? "bg-[#121214] text-zinc-100 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)]" : "bg-[#faf7f5] text-stone-900 sm:border-stone-300 sm:shadow-[0_25px_60px_rgba(0,0,0,0.2)]"
          } ${isTransitioningTheme ? "theme-transition" : ""}`}
        >
        {/* TOP HEADER: Clean & Breathable Navigation Bar (Dynamic Island Removed, All Buttons 100% Visible) */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between px-4 pt-1 shrink-0 transition-all duration-300 select-none">
          {/* Left: Hamburger Button & Branded Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`flex size-9 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800/60" : "text-stone-700 hover:bg-stone-200/60"
              }`}
              aria-label="Open Sidebar"
            >
              <Menu className="size-5" />
            </button>

            {/* Branded Logo */}
            <span
              className={`text-base font-bold tracking-tight select-none ${
                isDark ? "text-zinc-100" : "text-stone-900"
              }`}
            >
              {language === "hi" ? "सखी" : "Sakhi"}
              <span className="text-rose-500 text-xs ml-0.5">●</span>
            </span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* New Chat Button */}
            <button
              onClick={startNewChat}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800/60" : "text-stone-700 hover:bg-stone-200/60"
              }`}
              title={language === "hi" ? "नई बातचीत" : "New Chat"}
            >
              <SquarePen className="size-4" />
            </button>

            {/* Monochrome Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800/60" : "text-stone-700 hover:bg-stone-200/60"
              }`}
              title={language === "hi" ? "थीम बदलें" : "Toggle Theme"}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Language Toggle (Clean Globe Icon Only) */}
            <button
              onClick={() => setLanguage((l) => (l === "hi" ? "en" : "hi"))}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800/60" : "text-stone-700 hover:bg-stone-200/60"
              }`}
              title={language === "hi" ? "भाषा बदलें" : "Switch Language"}
            >
              <Globe className="size-4" />
            </button>

            {/* Evaluator Tour Guide Pill */}
            <button
              onClick={() => setShowTour((t) => !t)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer border ${
                showTour
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                  : isDark
                  ? "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200"
                  : "bg-stone-200 text-stone-600 border-stone-300 hover:text-stone-900"
              }`}
              title="Toggle Interactive Evaluator Tour"
            >
              <Sparkles className="size-3 text-emerald-400" />
              <span className="hidden xs:inline">Tour</span>
            </button>

            {/* Restart Onboarding Screen */}
            <button
              onClick={() => setShowWelcomeScreen(true)}
              className={`flex size-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60" : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
              title="Restart Demo Onboarding"
            >
              <Compass className="size-3.5" />
            </button>

            {/* SOS Emergency Button */}
            <button
              onClick={triggerEmergency}
              className="flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 transition-colors cursor-pointer shadow-sm"
              title={language === "hi" ? "आपातकाल" : "Emergency SOS"}
            >
              <AlertTriangle className="size-3 text-white animate-bounce" />
              <span>SOS</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA: Pixel-Perfect Vertical Balance */}
        <div className="relative flex flex-1 flex-col overflow-hidden px-4 pb-1 min-h-0">
          
          {/* HOME VIEW: Two Balanced Tiers (No Void, Never Pushes Bar Off Screen) */}
          {!isChatTranscriptOpen ? (
            <div className="flex flex-1 flex-col justify-between py-1 min-h-0 overflow-hidden animate-in fade-in duration-300">
              
              {/* UPPER SECTION: Centered Majestic Living Orb (Clean, Zero Waveforms) */}
              <div className="flex flex-1 flex-col items-center justify-center py-2 min-h-0">
                <div className="relative flex items-center justify-center shrink-0 my-auto">
                  <LivingVoiceOrb state={orbState} onActivate={handleOrbTap} size={280} />
                </div>

                {/* Subtle Breathing Status Cue */}
                <div className="mt-2 text-center shrink-0">
                  <span
                    className={`text-[11px] font-mono font-medium tracking-wide transition-opacity duration-300 ${
                      orbState === "thinking"
                        ? "text-amber-400 animate-pulse"
                        : orbState === "listening"
                        ? "text-rose-400 animate-pulse"
                        : orbState === "speaking"
                        ? "text-emerald-400 animate-pulse"
                        : isDark
                        ? "text-zinc-500"
                        : "text-stone-500"
                    }`}
                  >
                    {orbState !== "idle"
                      ? getStatusWord()
                      : language === "hi"
                      ? "बात करने के लिए कॉल करें या टैप करें"
                      : "Tap or Call to speak"}
                  </span>
                </div>
              </div>

              {/* LOWER SECTION: Minimalist Natural Prompt List (No Cards, No Subtitle) */}
              <div className="w-full shrink-0 pt-2 pb-2">
                <h2 className={`text-base font-bold tracking-tight mb-2.5 ${isDark ? "text-zinc-100" : "text-stone-900"}`}>
                  {language === "hi" ? "नमस्ते!" : "Good Morning!"}
                </h2>

                {/* ACTIVE DUE DOSE CARD (Cross-Screen Synchronized with Caregiver Portal) */}
                {dueDose && (
                  <div className="mb-3 p-3 rounded-2xl border border-amber-500/40 bg-zinc-900/90 shadow-sm flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">💊</span>
                        <span className="text-[11px] font-bold text-amber-400">
                          {language === "hi" ? "अगली खुराक का समय" : "Next Due Dose"}
                        </span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {dueDose.time}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-100 mt-1">
                        {dueDose.name} {dueDose.dosage}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">{dueDose.instructions}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          markDose(dueDose.id, "TAKEN");
                          handleTrigger(
                            language === "hi" ? `${dueDose.name} ले ली` : `Took ${dueDose.name}`,
                            language === "hi"
                              ? `बहुत बढ़िया दादी जी! मैंने दर्ज कर लिया है कि आपने ${dueDose.name} ले ली है। स्वास्थ्य रिकॉर्ड अपडेट हो गया है।`
                              : `Recorded, Dadi! ${dueDose.name} marked as taken. Compliance updated.`
                          );
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        {language === "hi" ? "ले ली ✓" : "Taken ✓"}
                      </button>
                      <button
                        onClick={() => {
                          markDose(dueDose.id, "SKIPPED");
                          void sendCareAlert("DOSE_SKIPPED", `${dueDose.name} ${dueDose.dosage} was marked not taken.`);
                          handleTrigger(
                            language === "hi" ? `${dueDose.name} अभी नहीं ली` : `Skipped ${dueDose.name}`,
                            language === "hi"
                              ? `ठीक है। मैंने ${dueDose.name} को आज के लिए नहीं ली गई के रूप में दर्ज किया है।`
                              : `Understood. I recorded ${dueDose.name} as not taken today.`
                          );
                        }}
                        className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 px-2 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        {language === "hi" ? "नहीं ली" : "Not taken"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {minimalPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrigger(p.text, p.reply)}
                      className="group flex w-full items-center gap-3 py-1 text-left transition-all duration-150 cursor-pointer bg-transparent border-0 outline-none select-none"
                    >
                      <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">{p.icon}</span>
                      <span
                        className={`text-xs font-medium tracking-tight transition-colors ${
                          isDark ? "text-zinc-300 group-hover:text-white" : "text-stone-700 group-hover:text-stone-900"
                        }`}
                      >
                        {p.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CHAT VIEW: Clean Centered Orb at Top, Scrolling Transcript Below */
            <div className="flex flex-1 flex-col overflow-hidden animate-in fade-in duration-300 min-h-0">
              {/* Top Centered Orb */}
              <div className="w-full flex flex-col items-center justify-center pt-1 pb-1 shrink-0 z-10">
                <div
                  style={{
                    transform: "scale(0.68)",
                    transformOrigin: "center center",
                    transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  className="relative flex items-center justify-center shrink-0"
                >
                  <div
                    className={`absolute -inset-6 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none ${
                      orbState === "listening"
                        ? "bg-rose-500/25 opacity-100"
                        : orbState === "thinking"
                        ? "bg-amber-500/25 opacity-100"
                        : orbState === "speaking"
                        ? "bg-emerald-500/25 opacity-100"
                        : "bg-teal-500/10 opacity-60"
                    }`}
                  />
                  <LivingVoiceOrb state={orbState} onActivate={handleOrbTap} />
                </div>

                <span
                  className={`mt-1 text-[11px] font-mono font-medium tracking-wide transition-opacity duration-300 ${
                    orbState === "thinking"
                      ? "text-amber-400 animate-pulse"
                      : orbState === "listening"
                      ? "text-rose-400 animate-pulse"
                      : orbState === "speaking"
                      ? "text-emerald-400 animate-pulse"
                      : isDark
                      ? "text-zinc-400"
                      : "text-stone-600"
                  }`}
                >
                  {getStatusWord()}
                </span>
              </div>

              {/* Chat Transcript Area */}
              <div className="w-full flex-1 flex flex-col overflow-hidden pt-1 min-h-0">
                <AgentChatTranscript
                  messages={messages}
                  agentState={orbState}
                  isDark={isDark}
                  language={language}
                />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM OFFICIAL LIVEKIT AGENT CONTROL BAR (Pixel-perfect match to Screenshot 1) */}
        <div className="px-3 pb-3 pt-1 shrink-0 z-20">
          <AgentControlBar
            isTextInputOpen={isTextInputOpen}
            isChatTranscriptOpen={isChatTranscriptOpen}
            isCallConnected={isCallConnected}
            isMicMuted={isMicMuted}
            onToggleMic={handleToggleMic}
            onToggleChatButton={handleToggleChatButton}
            onStartCall={handleStartCall}
            onEndCall={handleEndCall}
            onSendMessage={handleSendMessage}
            isDark={isDark}
            language={language}
          />
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="w-full flex justify-center pb-1.5 shrink-0 z-20 select-none">
          <div className={`h-1 w-28 rounded-full ${isDark ? "bg-white/20" : "bg-black/20"}`} />
        </div>

        {/* ===================== SIDEBAR & MODALS ===================== */}

        {/* 1. SAKHI SIDEBAR DRAWER */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-50 flex">
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />
            <div
              className={`relative z-10 flex h-full w-[82%] max-w-[320px] flex-col p-4 shadow-2xl animate-in slide-in-from-left duration-300 border-r ${
                isDark ? "bg-[#161619] border-zinc-800 text-white" : "bg-white border-stone-200 text-stone-900"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-rose-600 text-white">
                    <Heart className="size-4 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">{language === "hi" ? "सखी" : "Sakhi"}</h3>
                    <p className="text-[10px] text-zinc-400">{language === "hi" ? "स्वास्थ्य साथी" : "Elder Care Companion"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Patient Card */}
              <div
                className={`mt-3 rounded-2xl border p-3 ${
                  isDark ? "bg-[#202025] border-zinc-800" : "bg-stone-50 border-stone-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-lg">
                    👵
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold">{language === "hi" ? "प्रभा देवी" : "Prabha Devi"}</h4>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      {language === "hi" ? "72 वर्ष · बीपी सामान्य" : "72 yrs · BP Stable"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{language === "hi" ? "देखरेख: प्रशांत" : "Caregiver: Prashant"}</span>
                  <span className="text-rose-400 font-medium">SOS</span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="mt-4 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1">
                  {language === "hi" ? "सुविधाएं" : "Features"}
                </p>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsCaregiverOpen(true);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isDark ? "text-zinc-300 hover:bg-zinc-800 hover:text-white" : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>{language === "hi" ? "पारिवारिक देखभाल (पासकोड)" : "Caregiver Portal (Passcode)"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsApptOpen(true);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isDark ? "text-zinc-300 hover:bg-zinc-800 hover:text-white" : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <Calendar className="size-4 text-rose-500" />
                  <span>{language === "hi" ? "डॉक्टर परामर्श" : "Doctor Appointments"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsUploadOpen(true);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isDark ? "text-zinc-300 hover:bg-zinc-800 hover:text-white" : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <FileText className="size-4 text-amber-400" />
                  <span>{language === "hi" ? "नया पर्चा" : "Upload Prescription"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    triggerEmergency();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="size-4 text-rose-500" />
                  <span>{language === "hi" ? "आपातकालीन सहायता" : "Emergency SOS"}</span>
                </button>
              </div>

              {/* Clean Minimalist Divider Separating Chat History */}
              <div className="my-3 border-t border-zinc-800/80" />

              {/* History Section */}
              <div className="flex-1 overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1.5">
                  {language === "hi" ? "इतिहास" : "History"}
                </p>

                <div className="space-y-1">
                  <div
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleTrigger("सुबह की दवा खुराक", "आपकी 40mg गोली दर्ज है।");
                    }}
                    className={`flex flex-col rounded-xl px-3 py-2 transition-colors cursor-pointer ${
                      isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-stone-100 text-stone-800"
                    }`}
                  >
                    <span className="text-xs truncate">{language === "hi" ? "सुबह की दवा खुराक" : "Morning BP dosage"}</span>
                    <span className="text-[10px] text-zinc-500">09:15 AM</span>
                  </div>

                  <div
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleTrigger("घुटने के दर्द का परामर्श", "तिल के तेल से मालिश करें और धूप में बैठें।");
                    }}
                    className={`flex flex-col rounded-xl px-3 py-2 transition-colors cursor-pointer ${
                      isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-stone-100 text-stone-800"
                    }`}
                  >
                    <span className="text-xs truncate">{language === "hi" ? "घुटने के दर्द का परामर्श" : "Knee pain consultation"}</span>
                    <span className="text-[10px] text-zinc-500">02:40 PM</span>
                  </div>
                </div>
              </div>

              {/* Footer Pill Button: Start New Chat */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    startNewChat();
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Start New Chat"
                >
                  <SquarePen className="size-3.5" />
                  <span>{language === "hi" ? "चैट" : "Chat"}</span>
                </button>
                <span className="text-[10px] text-zinc-500">LiveKit</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Shared Doctor Appointments */}
        {isApptOpen && (
          <div className={`absolute inset-0 z-40 flex flex-col p-5 animate-in fade-in duration-200 ${isDark ? "bg-[#161619] text-white" : "bg-white text-stone-900"}`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-rose-500" />
                <h3 className="text-sm font-bold">Appointments</h3>
              </div>
              <button onClick={() => setIsApptOpen(false)} aria-label="Close appointments" className="flex size-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto space-y-3">
              {appts.length ? appts.map((appointment) => (
                <div key={appointment.id} className={`rounded-2xl border p-3.5 ${isDark ? "border-zinc-800 bg-[#202025]" : "border-stone-200 bg-stone-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold">{appointment.doctorName}</h4>
                    <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-[10px] font-medium">{appointment.status}</span>
                  </div>
                  <p className="text-[11px] text-rose-500 font-medium mt-0.5">{appointment.specialty}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                    <Clock className="size-3 text-zinc-500" /> {formatAppointmentDate(appointment.date, language)} - {appointment.time} - {appointment.hospital}
                  </p>
                </div>
              )) : <p className="py-10 text-center text-sm text-zinc-400">No appointments have been added yet.</p>}
            </div>
            <button onClick={() => { setIsApptOpen(false); setIsCaregiverOpen(true); }} className="mt-3 w-full rounded-2xl bg-rose-600 py-3 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-colors cursor-pointer">
              Manage appointments in caregiver portal
            </button>
            <AgentPopup agentName="Sakhi" isDark={isDark} language={language} featureContext="Appointments" onTriggerVoice={handleToggleMic} />
          </div>
        )}
        {/* 3. PARCHA UPLOAD MODAL WITH IN-FEATURE LIVEKIT AGENT POPUP */}
        {isUploadOpen && (
          <div
            className={`absolute inset-0 z-40 flex flex-col p-5 animate-in fade-in duration-200 ${
              isDark ? "bg-[#161619] text-white" : "bg-white text-stone-900"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-amber-400" />
                <h3 className="text-sm font-bold">{language === "hi" ? "नया पर्चा" : "Upload Prescription"}</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <PrescriptionReview onSave={(items) => { addMedications(items); setIsUploadOpen(false); }} />

            {/* In-Feature LiveKit Floating Assistant Popup */}
            <AgentPopup
              agentName={language === "hi" ? "सखी" : "Sakhi"}
              isDark={isDark}
              language={language}
              featureContext={language === "hi" ? "पर्चा रिकॉर्ड" : "Prescription"}
              onTriggerVoice={handleToggleMic}
            />
          </div>
        )}

        {/* 4. PASSCODE-PROTECTED CAREGIVER & FAMILY PORTAL (DPDP 2023) */}
        <CaregiverPortalModal
          syncStatus={syncStatus}
          doseRecords={doseRecords}
          isOpen={isCaregiverOpen}
          onClose={() => {
            setIsCaregiverOpen(false);
            setCaregiverAutoAuth(false);
          }}
          isDark={isDark}
          language={language}
          meds={meds}
          onUpdateMed={updateMedication}
          onRemoveMed={removeMedication}
          onAddMed={addMedication}
          appts={appts}
          onAddAppt={addAppointment}
          onUpdateAppt={updateAppointment}
          adherencePct={adherencePct}
          takenCount={takenCount}
          onOpenVisitBrief={(appt) => {
            setActiveBriefAppt(appt);
            setIsBriefModalOpen(true);
            setCompletedTourSteps((prev) => ({ ...prev, 5: true }));
          }}
          autoAuth={caregiverAutoAuth}
        />
      </div>

      {/* 5. CLINICAL DOCTOR VISIT BRIEF MODAL */}
      <DoctorVisitBriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        appointment={activeBriefAppt}
        meds={meds}
        adherencePct={adherencePct}
        isDark={isDark}
        language={language}
      />

      {/* 6. WELCOME ONBOARDING SCREEN ("Try Sakhi, No Sign-up") */}
      {showWelcomeScreen && (
        <WelcomeScreen
          language={language}
          onStartDemo={(withTour) => {
            setShowWelcomeScreen(false);
            setShowTour(withTour);
          }}
        />
      )}
    </div>
  </div>
);
}
