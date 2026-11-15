"use client";

import React, { useState } from "react";
import { Bot, X, MessageSquare, Mic, Sparkles } from "lucide-react";
import { AgentControlBar } from "./agent-control-bar";
import { AgentChatTranscript, type TranscriptMessage } from "./agent-chat-transcript";
import type { VoiceState } from "@/types/voice";

export interface AgentPopupProps {
  agentName?: string;
  isDark?: boolean;
  language?: "hi" | "en";
  featureContext?: string; // e.g. "Appointments" or "Prescription"
  onTriggerVoice?: () => void;
}

export function AgentPopup({
  agentName = "Sakhi",
  isDark = true,
  language = "hi",
  featureContext = "Healthcare",
  onTriggerVoice,
}: AgentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupState, setPopupState] = useState<VoiceState>("idle");
  const [messages, setMessages] = useState<TranscriptMessage[]>([
    {
      id: "popup-welcome",
      sender: "agent",
      text: language === "hi"
        ? `नमस्ते दादी जी! मैं ${featureContext} में आपकी सहायता के लिए यहाँ हूँ। कुछ भी पूछें।`
        : `Hello Dadi! I am here to assist you with ${featureContext}. Ask me anything.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSend = (text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: TranscriptMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: timeStr,
    };
    setMessages((prev) => [...prev, userMsg]);
    setPopupState("thinking");

    setTimeout(() => {
      setPopupState("speaking");
      const agentReply: TranscriptMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: language === "hi"
          ? `मैंने ${featureContext} के रिकॉर्ड से जांच कर ली है। सब कुछ सुरक्षित व दर्ज है।`
          : `Verified with your ${featureContext} records. Everything is safe and confirmed.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentReply]);

      setTimeout(() => {
        setPopupState("idle");
      }, 3500);
    }, 1200);
  };

  return (
    <div className="absolute bottom-4 right-4 z-50">
      {/* 1. FLOATING POPUP DIALOG (LiveKit Agent Popup - 01 Surface) */}
      {isOpen && (
        <div
          className={`absolute bottom-16 right-0 w-[310px] h-[380px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md ${
            isDark
              ? "bg-[#18181c]/95 border-zinc-700 text-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              : "bg-white/95 border-stone-200 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-3.5 py-2.5 border-b shrink-0 ${
              isDark ? "border-zinc-800 bg-[#1e1e24]" : "border-stone-200 bg-stone-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
                <Bot className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  {agentName}
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-[10px] text-zinc-400 truncate max-w-[150px]">{featureContext} Assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="flex size-6 items-center justify-center rounded-full bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Transcript Area */}
          <AgentChatTranscript
            messages={messages}
            agentState={popupState}
            isDark={isDark}
            language={language}
            className="p-3 text-[11px]"
          />

          {/* Mini Control Bar at Bottom */}
          <div className="p-2 border-t border-zinc-800/80">
            <AgentControlBar
              isChatOpen={true}
              isConnected={true}
              onSendMessage={handleSend}
              onToggleMic={() => {
                if (onTriggerVoice) onTriggerVoice();
              }}
              onDisconnect={() => setIsOpen(false)}
              controls={{ microphone: true, chat: false, leave: true, camera: false, screenShare: false }}
              isDark={isDark}
              language={language}
            />
          </div>
        </div>
      )}

      {/* 2. FLOATING TRIGGER BUTTON (LiveKit Agent Popup Trigger) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex size-12 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-rose-500/20"
        title="Open LiveKit Sakhi Assistant"
      >
        <div className="absolute -inset-1 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
        {isOpen ? <X className="size-5" /> : <Bot className="size-5" />}
      </button>
    </div>
  );
}
