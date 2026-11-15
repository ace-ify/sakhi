"use client";

import React, { useState, useEffect } from "react";
import LivingVoiceOrb from "@/components/ui/orb-bloop";
import type { VoiceState } from "@/types/voice";
import { AgentControlBar } from "@/components/agents-ui/agent-control-bar";
import { AgentChatTranscript, type TranscriptMessage } from "@/components/agents-ui/agent-chat-transcript";
import { AgentPopup } from "@/components/agents-ui/agent-popup";
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
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [statusWordIndex, setStatusWordIndex] = useState(0);

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

  // Execute a prompt or send text message
  const handleTrigger = (promptText: string, replyText: string) => {
    // When text is sent, open both the text bar and the full transcript!
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

      setTimeout(() => {
        setOrbState("idle");
      }, 5000);
    }, 1200);
  };

  // Chat Button toggle logic:
  // - If chat transcript is currently open -> close both transcript & text input (return to clean home screen)
  // - If transcript is closed:
  //   * If existing chat history exists -> open BOTH transcript & text input!
  //   * If no chat history yet -> toggle text input box only!
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
    setIsCallConnected(false);
    setIsMicMuted(true); // Always return to muted when call ends!
    setOrbState("idle");
  };

  // Toggle Mic (Left Button in Control Bar: Mic toggle)
  // Strictly toggles mic mute state; only operates when call is active
  const handleToggleMic = () => {
    if (!isCallConnected) return; // Strict guard: cannot unmute unless in a call
    setIsMicMuted((prev) => {
      const nextMuted = !prev;
      setOrbState(nextMuted ? "idle" : "listening");
      return nextMuted;
    });
  };

  // Tap Orb Action:
  const handleOrbTap = () => {
    if (!isCallConnected) {
      handleStartCall();
    } else {
      handleToggleMic();
    }
  };

  // Send query typed in Control Bar
  const handleSendMessage = (text: string) => {
    handleTrigger(
      text,
      language === "hi"
        ? `मैंने आपका संदेश दर्ज कर लिया है: "${text}"। स्वास्थ्य रिकॉर्ड सुरक्षित है।`
        : `Recorded your query: "${text}". Health journal is up to date.`
    );
  };

  // SOS Emergency Alert
  const triggerEmergency = () => {
    setOrbState("emergency_active");
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: "prashant.caregiver@example.com",
        patientName: "Prabha Devi",
        type: "SOS_EMERGENCY",
        details: "Emergency SOS triggered on Sakhi elderly device.",
      }),
    }).catch(console.error);

    setTimeout(() => {
      alert(language === "hi" ? "🚨 आपातकालीन अलर्ट: प्रशांत को फोन व संदेश भेजा गया।" : "🚨 SOS ALERT: Caregiver notified via SMS & Phone.");
    }, 300);
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

      {/* CENTRAL PHONE CONTAINER: Pixel-Perfect for iPhone 16 Pro Max & Responsive Mobile */}
      <div
        className={`relative z-10 flex h-[100dvh] max-h-none sm:h-[880px] sm:max-h-[92vh] w-full max-w-full sm:max-w-[420px] flex-col overflow-hidden rounded-none sm:rounded-[36px] sm:border-[3px] shadow-2xl transition-colors duration-500 mx-auto ${
          isDark
            ? "bg-[#121214] text-zinc-100 sm:border-[#2e2e34] sm:ring-1 sm:ring-white/10 sm:shadow-[0_25px_70px_rgba(0,0,0,0.9)]"
            : "bg-[#faf7f5] text-stone-900 sm:border-[#d4d4d8] sm:ring-1 sm:ring-black/10 sm:shadow-[0_25px_60px_rgba(0,0,0,0.2)]"
        } ${isTransitioningTheme ? "theme-transition" : ""}`}
      >
        {/* TOP HEADER: Clean & Breathable */}
        <header className="flex h-14 items-center justify-between px-4 pt-1 shrink-0 z-20">
          {/* Left: Hamburger Button & Branded Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`flex size-9 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-200"
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
                isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-200"
              }`}
              title={language === "hi" ? "नई बातचीत" : "New Chat"}
            >
              <SquarePen className="size-4" />
            </button>

            {/* Monochrome Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-200"
              }`}
              title={language === "hi" ? "थीम बदलें" : "Toggle Theme"}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Language Toggle (Clean Globe Icon Only) */}
            <button
              onClick={() => setLanguage((l) => (l === "hi" ? "en" : "hi"))}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-200"
              }`}
              title={language === "hi" ? "भाषा बदलें" : "Switch Language"}
            >
              <Globe className="size-4" />
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
              
              {/* UPPER SECTION: Centered Majestic Living Orb */}
              <div className="flex flex-1 flex-col items-center justify-center py-2 min-h-0">
                <div
                  style={{
                    transform: "scale(1)",
                    transformOrigin: "center center",
                  }}
                  className="relative flex items-center justify-center shrink-0 my-auto"
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

              {/* LOWER SECTION: Clean iOS-Style Action Pills */}
              <div className="w-full shrink-0 pt-1 pb-1">
                <div className="mb-2">
                  <h2 className={`text-sm font-bold tracking-tight ${isDark ? "text-zinc-100" : "text-stone-900"}`}>
                    {language === "hi" ? "नमस्ते!" : "Good Morning!"}
                  </h2>
                  <p className={`text-[10px] ${isDark ? "text-zinc-500" : "text-stone-500"}`}>
                    {language === "hi" ? "दैनिक स्वास्थ्य सहायता के लिए चुनें" : "Quick health prompts"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {minimalPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrigger(p.text, p.reply)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all duration-200 cursor-pointer border ${
                        isDark
                          ? "bg-[#18181c]/90 hover:bg-[#202026] border-zinc-800/80 hover:border-zinc-700 text-zinc-200 shadow-xs active:scale-[0.99]"
                          : "bg-white hover:bg-stone-50 border-stone-200/90 text-stone-800 shadow-xs active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-xs shrink-0 select-none">{p.icon}</span>
                        <span className="text-xs font-medium tracking-tight truncate">{p.text}</span>
                      </div>
                      <span className={`text-[11px] font-mono shrink-0 ml-1.5 ${isDark ? "text-zinc-500" : "text-stone-400"}`}>
                        →
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

        {/* 2. DOCTOR APPOINTMENTS MODAL WITH IN-FEATURE LIVEKIT AGENT POPUP */}
        {isApptOpen && (
          <div
            className={`absolute inset-0 z-40 flex flex-col p-5 animate-in fade-in duration-200 ${
              isDark ? "bg-[#161619] text-white" : "bg-white text-stone-900"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-rose-500" />
                <h3 className="text-sm font-bold">{language === "hi" ? "डॉक्टर परामर्श" : "Appointments"}</h3>
              </div>
              <button
                onClick={() => setIsApptOpen(false)}
                className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3">
              <div className={`rounded-2xl border p-3.5 ${isDark ? "border-zinc-800 bg-[#202025]" : "border-stone-200 bg-stone-50"}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">Dr. Arvind Sharma</h4>
                  <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-[10px] font-medium">
                    {language === "hi" ? "कल" : "Tomorrow"}
                  </span>
                </div>
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">{language === "hi" ? "हृदय रोग" : "Cardiology"}</p>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="size-3 text-zinc-500" /> 10:30 AM · Max Hospital
                </p>
              </div>

              <div className={`rounded-2xl border p-3.5 ${isDark ? "border-zinc-800 bg-[#202025]" : "border-stone-200 bg-stone-50"}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">Dr. Meenakshi Iyer</h4>
                  <span className="rounded-full bg-zinc-800 text-zinc-400 px-2 py-0.5 text-[10px] font-medium">
                    20 Nov
                  </span>
                </div>
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">{language === "hi" ? "वरिष्ठ नागरिक" : "Geriatrician"}</p>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="size-3 text-zinc-500" /> 04:00 PM · Apollo Clinic
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                await fetch("/api/notify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    recipient: "prashant.caregiver@example.com",
                    patientName: "Prabha Devi",
                    type: "APPOINTMENT_REMINDER",
                    details: "Dr. Arvind Sharma (Cardiology) - Tomorrow at 10:30 AM.",
                  }),
                }).catch(console.error);
                alert(language === "hi" ? "ईमेल परिवार को भेजा गया।" : "Email sent to family.");
                setIsApptOpen(false);
              }}
              className="mt-3 w-full rounded-2xl bg-rose-600 py-3 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-colors cursor-pointer"
            >
              {language === "hi" ? "ईमेल रिमाइंडर भेजें" : "Send Email Reminder"}
            </button>

            {/* In-Feature LiveKit Floating Assistant Popup */}
            <AgentPopup
              agentName={language === "hi" ? "सखी" : "Sakhi"}
              isDark={isDark}
              language={language}
              featureContext={language === "hi" ? "डॉक्टर अपॉइंटमेंट" : "Appointments"}
              onTriggerVoice={handleToggleMic}
            />
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

            <div
              className={`mt-4 flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center ${
                isDark ? "border-zinc-700 bg-[#202025]" : "border-stone-300 bg-stone-50"
              }`}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-3">
                <FileText className="size-7" />
              </div>
              <h4 className="text-xs font-semibold">{language === "hi" ? "पर्चा या दवाई की फोटो खींचें" : "Take photo of prescription or medicine"}</h4>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[220px]">
                {language === "hi" ? "दवा का नाम व खुराक अपने आप लॉक हो जाएगी।" : "Dosage and medicine will be automatically verified."}
              </p>

              <button
                onClick={() => {
                  alert(language === "hi" ? "पर्चा सफलतापूर्वक सत्यापित हुआ।" : "Prescription verified successfully.");
                  setIsUploadOpen(false);
                  handleTrigger("नया पर्चा स्कैन किया", "पर्चा सुरक्षित रूप से पढ़ लिया गया है। दवाइयों के रिमाइंडर सेट हैं।");
                }}
                className="mt-5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-900 px-5 py-2 text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                {language === "hi" ? "स्कैन व वेरीफाई करें" : "Scan & Verify"}
              </button>
            </div>

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
      </div>
    </div>
  );
}
