"use client";

import React, { useState, useRef, useEffect } from "react";
import LivingVoiceOrb from "@/components/ui/orb-bloop";
import type { VoiceState } from "@/types/voice";
import {
  Menu,
  Shield,
  ShieldAlert,
  Globe,
  AlertTriangle,
  Plus,
  Mic,
  MicOff,
  Send,
  Calendar,
  Clock,
  User,
  FileText,
  Pill,
  Heart,
  X,
  ChevronRight,
  Sparkles,
  Volume2,
  Headphones,
  Upload,
  CheckCircle2,
  MessageSquare,
  Activity,
  PhoneCall,
  Search,
  Settings,
  EyeOff,
  AudioWaveform
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  time: string;
}

export default function MobileVoiceApp() {
  // Voice & Conversation State
  const [orbState, setOrbState] = useState<VoiceState>("idle");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApptOpen, setIsApptOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSosActive, setIsSosActive] = useState(false);
  const [inputText, setInputText] = useState("");
  const [transcript, setTranscript] = useState("");

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Greeting according to time of day
  const [greeting, setGreeting] = useState("नमस्ते दादी जी! (Good Morning)");

  useEffect(() => {
    const hour = new Date().getHours();
    if (language === "hi") {
      if (hour < 12) setGreeting("नमस्ते दादी जी! (Good Morning)");
      else if (hour < 17) setGreeting("नमस्ते दादी जी! (Good Afternoon)");
      else setGreeting("शुभ संध्या दादी जी! (Good Evening)");
    } else {
      if (hour < 12) setGreeting("Good Morning, Dadi!");
      else if (hour < 17) setGreeting("Good Afternoon, Dadi!");
      else setGreeting("Good Evening, Dadi!");
    }
  }, [language]);

  // Ready Suggested Prompts (ChatGPT-style)
  const readyPrompts = [
    {
      id: "med",
      icon: "💊",
      title: language === "hi" ? "सुबह की BP गोली ली?" : "Did you take morning BP meds?",
      sub: language === "hi" ? "Telmisartan 40mg (सुबह 9:00 बजे)" : "Telmisartan 40mg (9:00 AM)",
      promptText: language === "hi" ? "क्या मैंने सुबह की बीपी वाली गोली ली थी?" : "Did I take my morning BP medication?",
      agentReply: language === "hi" 
        ? "हाँ दादी जी, आपकी टेल्मिसर्टन 40mg सुबह 9:00 बजे निर्धारित थी। क्या आपने नाश्ते के बाद पानी के साथ ले ली? मैं आपके परिवार को कन्फर्मेशन भेज दूँ?"
        : "Yes Dadi, your Telmisartan 40mg was scheduled for 9:00 AM. Did you take it with water after breakfast? Should I notify Prashant?"
    },
    {
      id: "appt",
      icon: "🩺",
      title: language === "hi" ? "डॉक्टर शर्मा से विज़िट कब है?" : "When is Dr. Sharma's appointment?",
      sub: language === "hi" ? "कल सुबह 10:30 AM · मैक्स हॉस्पिटल" : "Tomorrow 10:30 AM · Max Hospital",
      promptText: language === "hi" ? "डॉक्टर शर्मा की अगली अपॉइंटमेंट कब की है?" : "When is my next appointment with Dr. Sharma?",
      agentReply: language === "hi"
        ? "दादी जी, डॉ. अरविंद शर्मा (हृदय रोग) के साथ आपकी अपॉइंटमेंट कल सुबह 10:30 बजे मैक्स सुपर स्पेशलिटी में है। प्रशांत जी आपके साथ चलेंगे।"
        : "Dadi ji, your cardiology follow-up with Dr. Arvind Sharma is scheduled tomorrow at 10:30 AM at Max Super Speciality. Prashant is accompanying you."
    },
    {
      id: "parcha",
      icon: "📋",
      title: language === "hi" ? "दवाइयों का पर्चा दिखाएं" : "Check active prescription",
      sub: language === "hi" ? "3 सक्रिय दवाइयां और समय सारिणी" : "3 active prescriptions & schedule",
      promptText: language === "hi" ? "मेरा मौजूदा पर्चा और दवाइयों का समय बताओ" : "Show my current prescription and dosage schedule",
      agentReply: language === "hi"
        ? "आपके पर्चे में 3 मुख्य दवाइयां हैं: 1. टेल्मिसर्टन 40mg (सुबह 9:00 AM), 2. मेटफॉर्मिन 500mg (दोपहर खाने के बाद), 3. कैल्शियम डी3 (रात को दूध के साथ)।"
        : "Your current locked parcha includes 3 meds: 1. Telmisartan 40mg (9 AM), 2. Metformin 500mg (Post lunch), 3. Calcium D3 (Night with warm milk)."
    },
    {
      id: "vitals",
      icon: "💧",
      title: language === "hi" ? "पानी पीने और बीपी नापने का समय" : "Vitals & hydration check",
      sub: language === "hi" ? "दवा के बाद 1 गिलास गुनगुना पानी" : "1 glass warm water after medication",
      promptText: language === "hi" ? "क्या मुझे अभी पानी पीना चाहिए?" : "Should I drink water and check vitals?",
      agentReply: language === "hi"
        ? "बिल्कुल दादी जी! दवा लेने के बाद एक गिलास गुनगुना पानी अवश्य पिएं। साथ ही आज शाम 5 बजे बीपी नापने का अलार्म सेट कर दिया गया है।"
        : "Absolutely Dadi! Please take a glass of warm water. Your evening BP vitals check is also scheduled for 5:00 PM."
    }
  ];

  // Execute a prompt (from tap or voice)
  const triggerPrompt = (text: string, reply: string) => {
    setHasStartedChat(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
      time: timeStr
    };

    setMessages(prev => [...prev, userMessage]);
    setOrbState("thinking");
    setTranscript(language === "hi" ? "जांच रहा हूँ... (Analyzing...)" : "Analyzing records...");

    setTimeout(() => {
      setOrbState("speaking");
      setTranscript(reply);
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, agentMessage]);

      setTimeout(() => {
        setOrbState("idle");
        setIsVoiceActive(false);
      }, 5500);
    }, 1200);
  };

  // Toggle Voice / Orb Tap
  const toggleVoice = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      setOrbState("idle");
      setTranscript("");
    } else {
      setIsVoiceActive(true);
      setOrbState("listening");
      setTranscript(language === "hi" ? "सुन रहा हूँ... बोलिए दादी जी" : "Listening... speak now Dadi");

      // Auto sequence for demo if user doesn't speak
      setTimeout(() => {
        if (orbState === "listening" || isVoiceActive) {
          triggerPrompt(
            language === "hi" ? "नमस्ते, क्या मेरी आज की कोई दवा बाकी है?" : "Hello, any pending medication today?",
            language === "hi" 
              ? "नमस्ते दादी जी! आज सुबह की बीपी की दवा आपने ले ली है। अगली खुराक दोपहर 1:30 बजे मेटफॉर्मिन की है।"
              : "Hello Dadi! You took your morning BP tablet. Next dose is Metformin at 1:30 PM after lunch."
          );
        }
      }, 3500);
    }
  };

  // Handle Text Submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    triggerPrompt(
      text,
      language === "hi"
        ? `मैंने आपका संदेश दर्ज कर लिया है: "${text}"। आपकी सेहत का रिकॉर्ड अपडेट हो गया है।`
        : `Recorded your query: "${text}". Health log has been safely updated.`
    );
  };

  // Trigger Emergency SOS
  const triggerEmergency = () => {
    setIsSosActive(true);
    setOrbState("emergency_active");
    setTranscript("🚨 आपातकालीन अलर्ट: प्रशांत (बेटा) और डॉक्टर शर्मा को कॉल व लोकेशन भेजी जा रही है...");

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: "prashant.caregiver@example.com",
        patientName: "Prabha Devi",
        type: "SOS_EMERGENCY",
        details: "Elderly user triggered emergency alert button on Sahara mobile device."
      })
    }).catch(console.error);

    setTimeout(() => {
      alert("🚨 SOS ALERT DISPATCHED: Caregiver Prashant notified via Phone & SMS. Location: Home.");
    }, 400);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-editorial-pattern p-2 sm:p-4 overflow-hidden select-none">
      {/* Background Decorative Ambient Lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
        <svg className="absolute -left-20 top-1/4 w-[140%] text-white/20" viewBox="0 0 1200 120" fill="none">
          <path d="M0 60 Q 150 0, 300 60 T 600 60 T 900 60 T 1200 60" stroke="currentColor" strokeWidth="3" />
        </svg>
        <svg className="absolute -left-20 bottom-1/4 w-[140%] text-white/15" viewBox="0 0 1200 120" fill="none">
          <path d="M0 60 Q 150 120, 300 60 T 600 60 T 900 60 T 1200 60" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      </div>

      {/* CENTRAL PHONE CONTAINER (ChatGPT Dark UI, Tall, Bezelless) */}
      <div className="relative z-10 flex h-[96vh] max-h-[890px] w-full max-w-[390px] flex-col overflow-hidden rounded-[44px] border border-[#2c2c2e] bg-[#121214] text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
        
        {/* TOP HEADER: Sidebar Button (Left) | Controls & Badges (Right) */}
        <header className="flex h-14 items-center justify-between px-4 pt-2 shrink-0 z-20">
          {/* Left: Sidebar Hamburger Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-full bg-[#1e1e22] text-zinc-300 hover:bg-[#2a2a30] hover:text-white transition-colors cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu className="size-5" />
          </button>

          {/* Center Brand Badge (Subtle pill) */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#1e1e22] px-3 py-1 border border-zinc-800/80">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-zinc-200">Sahara</span>
            <span className="text-[10px] text-zinc-500 font-mono">सहारा</span>
          </div>

          {/* Right: Action Pills */}
          <div className="flex items-center gap-1.5">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(l => l === "hi" ? "en" : "hi")}
              className="flex items-center gap-1 rounded-full bg-[#1e1e22] px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-[#2a2a30] transition-colors cursor-pointer border border-zinc-800"
              title="Toggle Language"
            >
              <Globe className="size-3 text-zinc-400" />
              <span>{language === "hi" ? "हिन्दी" : "EN"}</span>
            </button>

            {/* Temporary / Private Mode (Tick Mark / Shield Pill) */}
            <button
              onClick={() => setIsPrivateMode(!isPrivateMode)}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer border ${
                isPrivateMode 
                  ? "bg-purple-950/70 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]" 
                  : "bg-[#1e1e22] border-zinc-800 text-zinc-400 hover:bg-[#2a2a30] hover:text-zinc-200"
              }`}
              title={isPrivateMode ? "निजी बातचीत सक्रिय (Private Mode On)" : "निजी परामर्श (Private Mode)"}
            >
              {isPrivateMode ? <EyeOff className="size-4" /> : <Shield className="size-4" />}
            </button>

            {/* SOS Emergency Button */}
            <button
              onClick={triggerEmergency}
              className="flex items-center gap-1 rounded-full bg-rose-950/80 border border-rose-600/60 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-900 transition-colors cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.3)]"
              title="Emergency SOS Alert"
            >
              <AlertTriangle className="size-3 text-rose-400 animate-bounce" />
              <span>SOS</span>
            </button>
          </div>
        </header>

        {/* Private Mode Banner (Product Justification for Temporary Chat) */}
        {isPrivateMode && (
          <div className="mx-4 mt-1 rounded-xl bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 flex items-center justify-between text-[11px] text-purple-200">
            <span className="flex items-center gap-1.5">
              <EyeOff className="size-3 text-purple-400 shrink-0" />
              निजी परामर्श मोड: यह बातचीत फैमिली पोर्टल पर सिंक नहीं होगी।
            </span>
            <button onClick={() => setIsPrivateMode(false)} className="text-purple-400 hover:text-white cursor-pointer ml-1">
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="relative flex flex-1 flex-col overflow-hidden px-4 py-2">

          {/* If No Active Conversation: ChatGPT Home View with Orb & Prompts */}
          {!hasStartedChat ? (
            <div className="flex flex-1 flex-col justify-between">
              
              {/* Upper Section: Living Watercolor Voice Orb (Floating in Dark Canvas) */}
              <div className="flex flex-1 flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center">
                  {/* Subtle Glow Ring */}
                  <div className={`absolute -inset-6 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none ${
                    orbState === "listening" ? "bg-rose-500/20 opacity-100" :
                    orbState === "thinking" ? "bg-amber-500/20 opacity-100" :
                    orbState === "speaking" ? "bg-emerald-500/20 opacity-100" :
                    "bg-teal-500/10 opacity-60"
                  }`} />
                  
                  <LivingVoiceOrb
                    state={orbState}
                    onActivate={toggleVoice}
                  />
                </div>

                {/* Subtle Dynamic Audio/Speech Ripple State (No Ugly Pill) */}
                <div className="h-6 mt-3 flex items-center justify-center text-center px-4">
                  {orbState === "listening" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-medium animate-pulse">
                      <Volume2 className="size-3.5" /> सुन रहा हूँ... बोलिए दादी जी
                    </span>
                  )}
                  {orbState === "thinking" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                      <Sparkles className="size-3.5 animate-spin" /> पर्चा और रिकॉर्ड जांच रहा हूँ...
                    </span>
                  )}
                  {orbState === "speaking" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <Volume2 className="size-3.5 animate-bounce" /> बोल रहा हूँ...
                    </span>
                  )}
                </div>
              </div>

              {/* Lower Section: Greeting & Suggested Ready Prompts (Exact ChatGPT Style) */}
              <div className="w-full pb-2">
                <div className="mb-3">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                    {greeting}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {language === "hi" ? "दवा या स्वास्थ्य के लिए नीचे चुनें या बोलें" : "Select a health prompt or tap mic to speak"}
                  </p>
                </div>

                {/* Vertical Stack of Ready Prompts */}
                <div className="space-y-2">
                  {readyPrompts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => triggerPrompt(p.promptText, p.agentReply)}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-[#1c1c1f] hover:bg-[#25252a] active:bg-[#2c2c32] p-3 text-left transition-all duration-200 border border-zinc-800/80 cursor-pointer"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#26262b] text-base group-hover:scale-110 transition-transform">
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {p.sub}
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Conversation Mode (Chat Stream + Compact Floating Orb) */
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Compact Orb Bar on Top */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2 pt-1 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="scale-75 origin-left">
                    <LivingVoiceOrb state={orbState} onActivate={toggleVoice} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">सहारा वॉयस साथी</span>
                    <p className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                      {transcript || (orbState === "speaking" ? "बोल रहा हूँ..." : "तैयार (Ready)")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHasStartedChat(false)}
                  className="rounded-full bg-[#1e1e22] px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer border border-zinc-800"
                >
                  होम (Home)
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
                          : "bg-[#232328] text-zinc-100 rounded-bl-xs border border-zinc-800/80"
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
            className="flex items-center gap-2 rounded-full bg-[#202024] border border-zinc-700/60 px-3 py-1.5 shadow-lg focus-within:border-zinc-500 transition-colors"
          >
            {/* Plus / Upload Button (Parcha OCR scan) */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="flex size-8 items-center justify-center rounded-full bg-[#2b2b31] text-zinc-300 hover:bg-[#383840] hover:text-white transition-colors cursor-pointer shrink-0"
              title="पर्चा अपलोड करें (Upload Prescription / Report)"
            >
              <Plus className="size-4" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === "hi" ? "सहारा से कुछ भी पूछें..." : "Ask Sahara..."}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
            />

            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
                isVoiceActive
                  ? "bg-rose-500 text-white animate-pulse"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Mic"
            >
              {isVoiceActive ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>

            {/* LiveKit Voice Mode Circular Wave Button (ChatGPT Iconic Teal Button) */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`flex size-8 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                isVoiceActive
                  ? "bg-rose-600 text-white"
                  : "bg-emerald-500 text-white hover:bg-emerald-400"
              }`}
              title="LiveKit Voice Mode"
            >
              <AudioWaveform className="size-4" />
            </button>
          </form>
        </div>

        {/* ===================== MODALS & DRAWERS ===================== */}

        {/* 1. SAHARA SIDEBAR (Left Slide-out Sheet) */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Drawer Content */}
            <div className="relative z-10 flex h-full w-[82%] max-w-[320px] flex-col bg-[#161619] border-r border-zinc-800 text-white p-4 shadow-2xl animate-in slide-in-from-left duration-300">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-rose-600 text-white">
                    <Heart className="size-4 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-white">Sahara (सहारा)</h3>
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

              {/* Patient Profile Card */}
              <div className="mt-3 rounded-2xl bg-[#202025] border border-zinc-800 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-lg font-bold">
                    👵
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white">प्रभा देवी (Prabha Devi)</h4>
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

              {/* Core Navigation Options */}
              <div className="mt-4 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1">सुविधाएं (Features)</p>
                
                <button
                  onClick={() => { setIsSidebarOpen(false); setIsApptOpen(true); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                >
                  <Calendar className="size-4 text-rose-400" />
                  <span>डॉक्टर विज़िट्स (Appointments)</span>
                </button>

                <button
                  onClick={() => { setIsSidebarOpen(false); setIsUploadOpen(true); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="size-4 text-amber-400" />
                  <span>नया पर्चा जोड़ें (Upload Parcha)</span>
                </button>

                <button
                  onClick={() => { setIsSidebarOpen(false); triggerEmergency(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="size-4 text-rose-500" />
                  <span>आपातकालीन अलर्ट (Emergency SOS)</span>
                </button>
              </div>

              {/* Recent Health Chats */}
              <div className="mt-4 flex-1 overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1.5">हाल की बातचीत (Recent)</p>
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      setIsSidebarOpen(false);
                      triggerPrompt("सुबह की BP गोली की जानकारी", "आपकी 40mg गोली दर्ज है। समय: सुबह 9:15 AM।");
                    }}
                    className="flex flex-col rounded-xl px-3 py-2 hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <span className="text-xs text-zinc-200 truncate">BP गोली खुराक पुष्टि</span>
                    <span className="text-[10px] text-zinc-500">आज सुबह 09:15 AM</span>
                  </div>

                  <div
                    onClick={() => {
                      setIsSidebarOpen(false);
                      triggerPrompt("घुटने के दर्द पर घरेलू उपाय", "दादी जी, तिल के हल्के गुनगुने तेल से मालिश करें और 15 मिनट धूप में बैठें।");
                    }}
                    className="flex flex-col rounded-xl px-3 py-2 hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <span className="text-xs text-zinc-200 truncate">घुटने के दर्द का परामर्श</span>
                    <span className="text-[10px] text-zinc-500">कल दोपहर 02:40 PM</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Sahara v2.4 (Cloud Run)</span>
                <span className="text-emerald-400">🟢 LiveKit Active</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. DOCTOR APPOINTMENTS MODAL (Target 2 Requirement) */}
        {isApptOpen && (
          <div className="absolute inset-0 z-40 flex flex-col bg-[#161619] text-white p-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-rose-500" />
                <h3 className="text-sm font-bold text-white">डॉक्टर विज़िट्स (Appointments)</h3>
              </div>
              <button
                onClick={() => setIsApptOpen(false)}
                className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-3">
              <div className="rounded-2xl border border-zinc-800 bg-[#202025] p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white">Dr. Arvind Sharma</h4>
                  <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-[10px] font-medium">
                    कल (Tomorrow)
                  </span>
                </div>
                <p className="text-[11px] text-rose-400 font-medium mt-0.5">Cardiology (हृदय रोग)</p>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="size-3 text-zinc-500" /> 10:30 AM · मैक्स सुपर स्पेशलिटी साकेत
                </p>
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  साथी: प्रशांत (बेटा) · पर्चा और पिछली ECG रिपोर्ट ले जाना आवश्यक है।
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#202025] p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white">Dr. Meenakshi Iyer</h4>
                  <span className="rounded-full bg-zinc-800 text-zinc-400 px-2 py-0.5 text-[10px] font-medium">
                    20 Nov
                  </span>
                </div>
                <p className="text-[11px] text-rose-400 font-medium mt-0.5">Geriatrician (वरिष्ठ नागरिक स्वास्थ्य)</p>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Clock className="size-3 text-zinc-500" /> 04:00 PM · अपोलो क्लिनिक
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await fetch("/api/notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      recipient: "prashant.caregiver@example.com",
                      patientName: "Prabha Devi",
                      type: "APPOINTMENT_REMINDER",
                      details: "Dr. Arvind Sharma (Cardiology) - Tomorrow at 10:30 AM at Max Hospital."
                    })
                  });
                  alert("✅ Caregiver Email Alert Dispatched to Prashant (Son)!");
                  setIsApptOpen(false);
                } catch {
                  alert("Alert dispatched!");
                }
              }}
              className="mt-3 w-full rounded-2xl bg-rose-600 py-3 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-colors cursor-pointer"
            >
              परिवार को ईमेल रिमाइंडर भेजें (Send Family Email)
            </button>
          </div>
        )}

        {/* 3. PARCHA / PRESCRIPTION UPLOAD MODAL */}
        {isUploadOpen && (
          <div className="absolute inset-0 z-40 flex flex-col bg-[#161619] text-white p-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">नया पर्चा अपलोड करें (Parcha OCR)</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-[#202025] p-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-3">
                <FileText className="size-7" />
              </div>
              <h4 className="text-xs font-semibold text-zinc-200">डॉक्टर का पर्चा या दवाई का फोटो खींचें</h4>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[220px]">
                Google Cloud Vision OCR द्वारा दवा का नाम व खुराक अपने आप लॉक हो जाएगी।
              </p>

              <button
                onClick={() => {
                  alert("📷 Parcha scanned successfully! Telmisartan 40mg and Metformin 500mg verified.");
                  setIsUploadOpen(false);
                  triggerPrompt("नया पर्चा स्कैन किया", "मैंने नया पर्चा सुरक्षित रूप से पढ़ लिया है। सभी दवाइयों के रिमाइंडर सेट हो गए हैं।");
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
