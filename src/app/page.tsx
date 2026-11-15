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
  const [isMicMuted, setIsMicMuted] = useState(false);
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
    setIsMicMuted(false);
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
  // 1. If transcript is open -> close both transcript & text input (hide all text!).
  // 2. If closed -> open text bar input only!
  const handleToggleChatButton = () => {
    if (isChatTranscriptOpen) {
      setIsChatTranscriptOpen(false);
      setIsTextInputOpen(false);
    } else if (isTextInputOpen) {
      setIsTextInputOpen(false);
    } else {
      setIsTextInputOpen(true);
    }
  };

  // Start Call (Right Button in Control Bar)
  const handleStartCall = () => {
    setIsCallConnected(true);
    setIsMicMuted(false);
    setOrbState("listening");

    // Auto demo reply if user stays quiet
    setTimeout(() => {
      if (orbState === "listening" || isCallConnected) {
        handleTrigger(
          language === "hi" ? "नमस्ते, क्या आज की कोई दवा बाकी है?" : "Hello, any pending medication today?",
          language === "hi"
            ? "नमस्ते! सुबह की दवा पूरी हो चुकी है। अगली खुराक दोपहर 1:30 बजे मेटफॉर्मिन की है।"
            : "Hello! Morning BP medicine is recorded. Next dose is Metformin at 1:30 PM post lunch."
        );
      }
    }, 3500);
  };

  // End Call (Right Button in Control Bar)
  const handleEndCall = () => {
    setIsCallConnected(false);
    setIsMicMuted(true);
    setOrbState("idle");
  };

  // Toggle Mic (Left Button in Control Bar)
  const handleToggleMic = () => {
    if (!isCallConnected) {
      handleStartCall();
      return;
    }
    if (isMicMuted) {
      setIsMicMuted(false);
      setOrbState("listening");
    } else {
      setIsMicMuted(true);
      setOrbState("idle");
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-editorial-pattern p-2 sm:p-4 overflow-hidden select-none">
      {/* Background Subtle Ambient Wave Lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
        <svg className="absolute -left-20 top-1/4 w-[140%] text-white/20" viewBox="0 0 1200 120" fill="none">
          <path d="M0 60 Q 150 0, 300 60 T 600 60 T 900 60 T 1200 60" stroke="currentColor" strokeWidth="3" />
        </svg>
      </div>

      {/* CENTRAL PHONE CONTAINER (Clean, Bezelless, Tall Viewport) */}
      <div
        className={`relative z-10 flex h-[96vh] max-h-[890px] w-full max-w-[390px] flex-col overflow-hidden rounded-[44px] border shadow-2xl transition-colors duration-500 ${
          isDark
            ? "bg-[#121214] text-zinc-100 border-[#2c2c2e] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
            : "bg-[#faf7f5] text-stone-900 border-stone-300 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]"
        } ${isTransitioningTheme ? "theme-transition" : ""}`}
      >
        {/* TOP HEADER: Clean & Breathable (NO harsh horizontal divider line) */}
        <header className="flex h-14 items-center justify-between px-5 pt-2 shrink-0 z-20">
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

        {/* MAIN BODY AREA WITH CONTINUOUS GPU ORB GLIDE TRANSITION */}
        <div className="relative flex flex-1 flex-col overflow-hidden px-4 pb-2">
          
          {/* ORB SECTION: Spacious, breathable, positioned comfortably down, NO harsh lines */}
          <div
            style={{
              transform: isChatTranscriptOpen ? "translate3d(0, 4px, 0)" : "translate3d(0, 52px, 0)",
              transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="w-full flex items-center justify-between shrink-0 z-10"
          >
            {/* Orb + Claude Status Wrapper */}
            <div className="flex items-center gap-3">
              {/* Scaled living watercolor orb (Spacious 0.82 in compact, 1.0 in center) */}
              <div
                style={{
                  transform: isChatTranscriptOpen ? "scale(0.82)" : "scale(1)",
                  transformOrigin: "left center",
                  transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
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
                <LivingVoiceOrb state={orbState} onActivate={handleToggleMic} />
              </div>

              {/* Status Word Beside Orb */}
              <div className="flex flex-col">
                <span
                  className={`text-xs font-mono font-medium tracking-wide transition-opacity duration-300 ${
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
                {isChatTranscriptOpen && (
                  <span className="text-[10px] text-zinc-500">{language === "hi" ? "सखी साथी" : "Sakhi Companion"}</span>
                )}
              </div>
            </div>

            {/* Collapse Chat Button (Visible when chat transcript is open) */}
            {isChatTranscriptOpen && (
              <button
                onClick={() => {
                  setIsChatTranscriptOpen(false);
                  setIsTextInputOpen(false);
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border transition-colors cursor-pointer ${
                  isDark
                    ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white"
                    : "bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-900"
                }`}
                title={language === "hi" ? "ऑर्ब देखें" : "Full Orb"}
              >
                <span>{language === "hi" ? "ऑर्ब" : "Orb"}</span>
                <ChevronDown className="size-3" />
              </button>
            )}
          </div>

          {/* CHAT TRANSCRIPT AREA (Smoothly expands when message sent) */}
          <div
            style={{
              maxHeight: isChatTranscriptOpen ? "500px" : "0px",
              opacity: isChatTranscriptOpen ? 1 : 0,
              transform: isChatTranscriptOpen ? "translate3d(0, 0, 0)" : "translate3d(0, 20px, 0)",
              transition: "max-height 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 450ms ease, transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
              pointerEvents: isChatTranscriptOpen ? "auto" : "none",
            }}
            className="w-full flex-1 flex flex-col overflow-hidden pt-2"
          >
            <AgentChatTranscript
              messages={messages}
              agentState={orbState}
              isDark={isDark}
              language={language}
            />
          </div>

          {/* LOWER SECTION: Minimalist Prompts (Visible when transcript is closed) */}
          <div
            style={{
              opacity: !isChatTranscriptOpen && messages.length === 0 ? 1 : 0,
              transform: !isChatTranscriptOpen && messages.length === 0 ? "translate3d(0, 0, 0)" : "translate3d(0, 20px, 0)",
              transition: "opacity 400ms ease, transform 400ms ease",
              pointerEvents: !isChatTranscriptOpen && messages.length === 0 ? "auto" : "none",
            }}
            className={`w-full mt-auto pb-3 ${isChatTranscriptOpen ? "hidden" : "block"}`}
          >
            <div className="mb-2">
              <h2
                className={`text-lg font-bold tracking-tight ${
                  isDark ? "text-zinc-100" : "text-stone-900"
                }`}
              >
                {language === "hi" ? "नमस्ते!" : "Good Morning!"}
              </h2>
            </div>

            {/* Clean, minimalist single-line items */}
            <div className="space-y-1.5">
              {minimalPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTrigger(p.text, p.reply)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                    isDark
                      ? "hover:bg-zinc-800/80 text-zinc-300 hover:text-white"
                      : "hover:bg-stone-200/70 text-stone-700 hover:text-stone-900"
                  }`}
                >
                  <span className="text-sm select-none">{p.icon}</span>
                  <span className="truncate">{p.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* VIEW CHAT FLOATING PILL (When messages exist but transcript was minimized) */}
          {!isChatTranscriptOpen && messages.length > 0 && (
            <div className="flex justify-center mt-auto pb-2 animate-fade-in">
              <button
                onClick={() => {
                  setIsChatTranscriptOpen(true);
                  setIsTextInputOpen(true);
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border shadow-xs transition-colors cursor-pointer ${
                  isDark
                    ? "bg-zinc-800/90 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                    : "bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <MessageSquare className="size-3.5 text-rose-500" />
                <span>{language === "hi" ? "बातचीत देखें" : "View Chat"} ({messages.length})</span>
                <ChevronUp className="size-3.5" />
              </button>
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
