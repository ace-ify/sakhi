"use client";

import React, { useState, useRef, useEffect } from "react";
import LivingVoiceOrb from "@/components/ui/orb-bloop";
import type { VoiceState } from "@/types/voice";
import {
  Menu,
  Globe,
  Sun,
  Moon,
  AlertTriangle,
  Plus,
  Mic,
  MicOff,
  Send,
  Calendar,
  Clock,
  SquarePen,
  ChevronDown,
  ChevronUp,
  FileText,
  Heart,
  X,
  Upload,
  AudioWaveform,
  MessageSquare
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  time: string;
}

// Claude Code-style rotating status words
const THINKING_WORDS_HI = ["जांच रहा हूँ...", "पर्चा समझ रहा हूँ...", "दवा मिला रहा हूँ...", "तैयार कर रहा हूँ..."];
const THINKING_WORDS_EN = ["Analyzing...", "Synthesizing...", "Verifying...", "Retrieving EHR..."];

export default function MobileVoiceApp() {
  // Theme state: dark / light
  const [isDark, setIsDark] = useState(true);
  const [isTransitioningTheme, setIsTransitioningTheme] = useState(false);

  // Language state: "hi" (Pure Hindi) | "en" (Hinglish/English)
  const [language, setLanguage] = useState<"hi" | "en">("hi");

  // App & Conversation states
  const [orbState, setOrbState] = useState<VoiceState>("idle");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApptOpen, setIsApptOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // Controls chat drawer collapse/expand
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [statusWordIndex, setStatusWordIndex] = useState(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Cycle Claude Code status words when thinking
  useEffect(() => {
    if (orbState === "thinking") {
      const interval = setInterval(() => {
        setStatusWordIndex((prev) => (prev + 1) % 4);
      }, 1400);
      return () => clearInterval(interval);
    }
  }, [orbState]);

  useEffect(() => {
    if (messages.length > 0 && isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  // Theme switch with smooth circular expand
  const toggleTheme = () => {
    setIsTransitioningTheme(true);
    setIsDark((prev) => !prev);
    setTimeout(() => {
      setIsTransitioningTheme(false);
    }, 500);
  };

  // Start fresh chat (New Chat button like ChatGPT)
  const startNewChat = () => {
    setMessages([]);
    setIsChatOpen(false);
    setIsVoiceActive(false);
    setOrbState("idle");
    setInputText("");
  };

  // Suggested Prompts (Minimalist single line, exact ChatGPT style)
  const minimalPrompts = language === "hi"
    ? [
        { icon: "💊", text: "सुबह की बीपी दवा की स्थिति", reply: "दादी जी, आपकी टेल्मिसर्टन 40mg सुबह 9:00 बजे की थी। क्या आपने पानी के साथ ले ली?" },
        { icon: "🩺", text: "डॉक्टर शर्मा का अपॉइंटमेंट समय", reply: "डॉ. अरविंद शर्मा के साथ आपकी अपॉइंटमेंट कल सुबह 10:30 बजे मैक्स अस्पताल में है।" },
        { icon: "📋", text: "मौजूदा दवाइयों की सूची", reply: "आपके पर्चे में 3 दवाइयां हैं: टेल्मिसर्टन 40mg, मेटफॉर्मिन 500mg, और कैल्शियम डी3।" },
        { icon: "💧", text: "पानी और बीपी जांच का समय", reply: "दवा के बाद एक गिलास गुनगुना पानी पिएं। शाम 5 बजे बीपी जांच का अलार्म सेट है।" },
      ]
    : [
        { icon: "💊", text: "Morning BP medicine status", reply: "Dadi ji, your Telmisartan 40mg was scheduled at 9:00 AM. Did you take it with water?" },
        { icon: "🩺", text: "Dr. Sharma appointment time", reply: "Your cardiology visit with Dr. Arvind Sharma is tomorrow at 10:30 AM at Max Hospital." },
        { icon: "📋", text: "Current prescription list", reply: "You have 3 active meds: Telmisartan 40mg, Metformin 500mg, and Calcium D3." },
        { icon: "💧", text: "Hydration and BP check time", reply: "Please drink a glass of warm water. Your evening BP check is set for 5:00 PM." },
      ];

  // Execute a prompt
  const handleTrigger = (promptText: string, replyText: string) => {
    setIsChatOpen(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: promptText,
      time: timeStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    setOrbState("thinking");

    setTimeout(() => {
      setOrbState("speaking");
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);

      setTimeout(() => {
        setOrbState("idle");
        setIsVoiceActive(false);
      }, 5000);
    }, 1200);
  };

  // Toggle Voice / Tap Orb
  const toggleVoice = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      setOrbState("idle");
    } else {
      setIsVoiceActive(true);
      setOrbState("listening");

      // Demo auto trigger if user doesn't interrupt
      setTimeout(() => {
        if (isVoiceActive || orbState === "listening") {
          handleTrigger(
            language === "hi" ? "नमस्ते, क्या आज की कोई दवा बाकी है?" : "Hello, any pending medication today?",
            language === "hi"
              ? "नमस्ते दादी जी! सुबह की दवा पूरी हो चुकी है। अगली खुराक दोपहर 1:30 बजे मेटफॉर्मिन की है।"
              : "Hello Dadi! Morning BP medicine is recorded. Next dose is Metformin at 1:30 PM post lunch."
          );
        }
      }, 3500);
    }
  };

  // Submit Text Input
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setInputText("");
    handleTrigger(
      txt,
      language === "hi"
        ? `मैंने आपका संदेश दर्ज कर लिया है: "${txt}"। स्वास्थ्य रिकॉर्ड अपडेट है।`
        : `Recorded your query: "${txt}". Health journal is up to date.`
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
      alert("🚨 SOS ALERT: Caregiver notified via SMS & Phone. Location: Home.");
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
    if (orbState === "emergency_active" || orbState === "emergency_countdown") return "आपातकाल...";
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
        className={`relative z-10 flex h-[96vh] max-h-[890px] w-full max-w-[390px] flex-col overflow-hidden rounded-[44px] border shadow-2xl transition-colors duration-300 ${
          isDark
            ? "bg-[#121214] text-zinc-100 border-[#2c2c2e] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
            : "bg-[#faf7f5] text-stone-900 border-stone-300 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]"
        } ${isTransitioningTheme ? "theme-transition" : ""}`}
      >
        {/* TOP HEADER: Sidebar + Branded "Sakhi" (Left) | New Chat, Theme, Lang, SOS (Right) */}
        <header
          className={`flex h-14 items-center justify-between px-4 pt-1 shrink-0 z-20 border-b transition-colors ${
            isDark ? "border-zinc-800/80 bg-[#121214]/95" : "border-stone-200/80 bg-[#faf7f5]/95"
          }`}
        >
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

            {/* Branded Logo: Sakhi ● */}
            <span
              className={`text-base font-bold tracking-tight select-none ${
                isDark ? "text-zinc-100" : "text-stone-900"
              }`}
            >
              Sakhi
              <span className="text-rose-500 text-xs ml-0.5">●</span>
            </span>
          </div>

          {/* Right Action Icons: New Chat, Theme Switcher, Globe, SOS */}
          <div className="flex items-center gap-1">
            {/* New Chat Button (ChatGPT-style instant reset) */}
            <button
              onClick={startNewChat}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-200"
              }`}
              title="New Chat"
            >
              <SquarePen className="size-4" />
            </button>

            {/* Theme Switcher (Sun / Moon with Smooth Transition) */}
            <button
              onClick={toggleTheme}
              className={`flex size-8 items-center justify-center rounded-full transition-transform active:scale-90 cursor-pointer ${
                isDark ? "text-amber-400 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-200"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Language Toggle (Clean Globe Icon Only) */}
            <button
              onClick={() => setLanguage((l) => (l === "hi" ? "en" : "hi"))}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? "text-zinc-300 hover:bg-zinc-800" : "text-stone-700 hover:bg-stone-200"
              }`}
              title={language === "hi" ? "Language: Hindi (click for English)" : "Language: English (click for Hindi)"}
            >
              <Globe className="size-4" />
            </button>

            {/* SOS Emergency Button */}
            <button
              onClick={triggerEmergency}
              className="flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 transition-colors cursor-pointer shadow-sm"
              title="Emergency SOS"
            >
              <AlertTriangle className="size-3 text-white animate-bounce" />
              <span>SOS</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <div className="relative flex flex-1 flex-col overflow-hidden px-4 py-2">
          
          {/* VIEW A: Full Centered Orb View (When chat drawer is closed) */}
          {!isChatOpen ? (
            <div className="flex flex-1 flex-col justify-between">
              
              {/* Center: The Focused Living Voice Orb */}
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute -inset-8 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none ${
                      orbState === "listening"
                        ? "bg-rose-500/25 opacity-100"
                        : orbState === "thinking"
                        ? "bg-amber-500/25 opacity-100"
                        : orbState === "speaking"
                        ? "bg-emerald-500/25 opacity-100"
                        : "bg-teal-500/10 opacity-60"
                    }`}
                  />
                  <LivingVoiceOrb state={orbState} onActivate={toggleVoice} />
                </div>

                {/* Claude Code-style Status Word underneath Orb */}
                <div className="mt-4 h-6 flex items-center justify-center">
                  {orbState !== "idle" && (
                    <span
                      className={`text-xs font-mono font-medium tracking-wide animate-pulse ${
                        orbState === "listening"
                          ? "text-rose-400"
                          : orbState === "thinking"
                          ? "text-amber-400"
                          : orbState === "speaking"
                          ? "text-emerald-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {getStatusWord()}
                    </span>
                  )}
                </div>
              </div>

              {/* Lower Section: Suggested Single-Line Prompts (Shown if no messages yet) */}
              {messages.length === 0 && (
                <div className="w-full pb-3 animate-fade-in">
                  <div className="mb-2.5">
                    <h2
                      className={`text-lg font-bold tracking-tight ${
                        isDark ? "text-zinc-100" : "text-stone-900"
                      }`}
                    >
                      {language === "hi" ? "नमस्ते दादी जी!" : "Morning!"}
                    </h2>
                  </div>

                  {/* Clean, minimalist single-line items matching ChatGPT reference */}
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
              )}

              {/* If messages exist but chat was minimized: Floating View Chat Pill */}
              {messages.length > 0 && (
                <div className="flex justify-center pb-2">
                  <button
                    onClick={() => setIsChatOpen(true)}
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
          ) : (
            /* VIEW B: Active Conversation Drawer (Shrunk Orb with Claude Code status + Chat) */
            <div className="flex flex-1 flex-col overflow-hidden animate-fade-in">
              {/* Shrunk Orb Header Bar */}
              <div
                className={`flex items-center justify-between border-b pb-2 mb-2 pt-1 shrink-0 ${
                  isDark ? "border-zinc-800" : "border-stone-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Compact Orb */}
                  <div className="scale-75 origin-left">
                    <LivingVoiceOrb state={orbState} onActivate={toggleVoice} />
                  </div>

                  {/* Claude Code-style Status Word with "..." */}
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-mono font-semibold tracking-wide ${
                        orbState === "thinking"
                          ? "text-amber-400 animate-pulse"
                          : orbState === "listening"
                          ? "text-rose-400 animate-pulse"
                          : orbState === "speaking"
                          ? "text-emerald-400 animate-pulse"
                          : isDark
                          ? "text-zinc-300"
                          : "text-stone-700"
                      }`}
                    >
                      {getStatusWord()}
                    </span>
                    <span className="text-[10px] text-zinc-500">Sakhi Companion</span>
                  </div>
                </div>

                {/* Collapse Chat Button (Returns to full orb mode!) */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border transition-colors cursor-pointer ${
                    isDark
                      ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white"
                      : "bg-stone-100 border-stone-300 text-stone-700 hover:text-stone-900"
                  }`}
                  title="Minimize Chat to Orb"
                >
                  <span>{language === "hi" ? "ऑर्ब देखें" : "Full Orb"}</span>
                  <ChevronDown className="size-3" />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-rose-600 text-white rounded-br-xs"
                          : isDark
                          ? "bg-[#232328] text-zinc-100 rounded-bl-xs border border-zinc-800/80"
                          : "bg-white text-stone-800 rounded-bl-xs border border-stone-200 shadow-xs"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CHATGPT-STYLE INPUT BAR */}
        <div className="px-3 pb-4 pt-1 shrink-0 z-20">
          <form
            onSubmit={handleTextSubmit}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-md transition-colors ${
              isDark
                ? "bg-[#202024] border-zinc-700/60 focus-within:border-zinc-500"
                : "bg-white border-stone-300 focus-within:border-stone-500"
            }`}
          >
            {/* Plus / Upload Button */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
                isDark ? "bg-[#2b2b31] text-zinc-300 hover:bg-[#383840]" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
              title="Upload Prescription / Report"
            >
              <Plus className="size-4" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === "hi" ? "सखी से कुछ भी पूछें..." : "Ask Sakhi..."}
              className={`flex-1 bg-transparent text-xs focus:outline-none ${
                isDark ? "text-white placeholder:text-zinc-500" : "text-stone-900 placeholder:text-stone-400"
              }`}
            />

            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
                isVoiceActive
                  ? "bg-rose-500 text-white animate-pulse"
                  : isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-stone-500 hover:text-stone-900"
              }`}
              title="Mic"
            >
              {isVoiceActive ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>

            {/* Circular Voice Waveform Button */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex size-8 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                isVoiceActive
                  ? "bg-rose-600 text-white"
                  : "bg-emerald-500 text-white hover:bg-emerald-400"
              }`}
              title="Voice Mode"
            >
              <AudioWaveform className="size-4" />
            </button>
          </form>
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
                    <h3 className="text-sm font-bold tracking-tight">Sakhi (सखी)</h3>
                    <p className="text-[10px] text-zinc-400">Elder Care Companion</p>
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
                    <h4 className="text-xs font-semibold">प्रभा देवी (Prabha Devi)</h4>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" /> 72 वर्ष · BP स्थिर (128/82)
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>देखरेखकर्ता: प्रशांत (बेटा)</span>
                  <span className="text-rose-400 font-medium">SOS तैयार</span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="mt-4 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1">
                  सुविधाएं (Features)
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
                  <span>डॉक्टर विज़िट्स (Appointments)</span>
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
                  <span>नया पर्चा जोड़ें (Upload Parcha)</span>
                </button>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    triggerEmergency();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="size-4 text-rose-500" />
                  <span>आपातकालीन अलर्ट (Emergency SOS)</span>
                </button>
              </div>

              {/* Recent Consultations */}
              <div className="mt-4 flex-1 overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1.5">
                  हाल की बातचीत (Recent)
                </p>
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleTrigger("सुबह की दवा का समय", "आपकी 40mg गोली दर्ज है। समय: सुबह 9:15 AM।");
                    }}
                    className={`flex flex-col rounded-xl px-3 py-2 transition-colors cursor-pointer ${
                      isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-stone-100 text-stone-800"
                    }`}
                  >
                    <span className="text-xs truncate">BP गोली खुराक पुष्टि</span>
                    <span className="text-[10px] text-zinc-500">आज सुबह 09:15 AM</span>
                  </div>

                  <div
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleTrigger("घुटने के दर्द पर सलाह", "दादी जी, तिल के हल्के गुनगुने तेल से मालिश करें और 15 मिनट धूप में बैठें।");
                    }}
                    className={`flex flex-col rounded-xl px-3 py-2 transition-colors cursor-pointer ${
                      isDark ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-stone-100 text-stone-800"
                    }`}
                  >
                    <span className="text-xs truncate">घुटने के दर्द का परामर्श</span>
                    <span className="text-[10px] text-zinc-500">कल दोपहर 02:40 PM</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Sakhi v2.4</span>
                <span className="text-emerald-400">🟢 LiveKit Active</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. DOCTOR APPOINTMENTS MODAL */}
        {isApptOpen && (
          <div
            className={`absolute inset-0 z-40 flex flex-col p-5 animate-in fade-in duration-200 ${
              isDark ? "bg-[#161619] text-white" : "bg-white text-stone-900"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-rose-500" />
                <h3 className="text-sm font-bold">डॉक्टर विज़िट्स (Appointments)</h3>
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
                    कल (Tomorrow)
                  </span>
                </div>
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">Cardiology (हृदय रोग)</p>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="size-3 text-zinc-500" /> 10:30 AM · मैक्स सुपर स्पेशलिटी साकेत
                </p>
              </div>

              <div className={`rounded-2xl border p-3.5 ${isDark ? "border-zinc-800 bg-[#202025]" : "border-stone-200 bg-stone-50"}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">Dr. Meenakshi Iyer</h4>
                  <span className="rounded-full bg-zinc-800 text-zinc-400 px-2 py-0.5 text-[10px] font-medium">
                    20 Nov
                  </span>
                </div>
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">Geriatrician (वरिष्ठ नागरिक)</p>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="size-3 text-zinc-500" /> 04:00 PM · अपोलो क्लिनिक
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
                alert("✅ Caregiver Email Alert Dispatched to Prashant!");
                setIsApptOpen(false);
              }}
              className="mt-3 w-full rounded-2xl bg-rose-600 py-3 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-colors cursor-pointer"
            >
              परिवार को ईमेल रिमाइंडर भेजें (Send Email)
            </button>
          </div>
        )}

        {/* 3. PARCHA UPLOAD MODAL */}
        {isUploadOpen && (
          <div
            className={`absolute inset-0 z-40 flex flex-col p-5 animate-in fade-in duration-200 ${
              isDark ? "bg-[#161619] text-white" : "bg-white text-stone-900"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-amber-400" />
                <h3 className="text-sm font-bold">नया पर्चा जोड़ें (Parcha OCR)</h3>
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
              <h4 className="text-xs font-semibold">डॉक्टर का पर्चा या दवाई की फोटो खींचें</h4>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[220px]">
                Google Cloud Vision OCR द्वारा दवा का नाम व खुराक अपने आप लॉक हो जाएगी।
              </p>

              <button
                onClick={() => {
                  alert("📷 Parcha verified! Telmisartan 40mg and Metformin 500mg logged.");
                  setIsUploadOpen(false);
                  handleTrigger("नया पर्चा स्कैन किया", "मैंने नया पर्चा सुरक्षित रूप से पढ़ लिया है। सभी दवाइयों के रिमाइंडर सेट हो गए हैं।");
                }}
                className="mt-5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-900 px-5 py-2 text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                स्कैन और वेरीफाई करें (Scan & Verify)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
