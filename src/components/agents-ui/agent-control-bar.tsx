"use client";

import React, { useState, useRef } from "react";
import { Mic, MicOff, MessageSquare, PhoneOff, PhoneCall, SendHorizontal, Loader2, ChevronDown } from "lucide-react";

export interface AgentControlBarProps {
  isChatOpen?: boolean;
  isCallConnected?: boolean;
  isMicMuted?: boolean;
  onToggleMic?: () => void;
  onToggleChat?: () => void;
  onStartCall?: () => void;
  onEndCall?: () => void;
  onSendMessage?: (message: string) => void;
  isDark?: boolean;
  language?: "hi" | "en";
}

export function AgentControlBar({
  isChatOpen = false,
  isCallConnected = true,
  isMicMuted = false,
  onToggleMic,
  onToggleChat,
  onStartCall,
  onEndCall,
  onSendMessage,
  isDark = true,
  language = "hi",
}: AgentControlBarProps) {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      if (onSendMessage) {
        onSendMessage(inputText.trim());
      }
      setInputText("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`w-full flex flex-col rounded-[26px] border p-2.5 shadow-xl transition-all duration-300 ${
        isDark
          ? "bg-[#18181c]/95 border-zinc-800/90 text-zinc-100"
          : "bg-white/95 border-stone-200 text-stone-900"
      }`}
    >
      {/* 1. TOP PART: Text Input (Exact match to Screenshot 1) */}
      <form onSubmit={handleSend} className="flex items-center justify-between gap-2 px-2 pt-1 pb-1">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={language === "hi" ? "कुछ लिखें..." : "Type something..."}
          className={`flex-1 bg-transparent text-xs focus:outline-none placeholder:text-zinc-500 ${
            isDark ? "text-zinc-100" : "text-stone-900"
          }`}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
            inputText.trim()
              ? "text-rose-500 hover:text-rose-400 scale-105 active:scale-95"
              : "text-zinc-500 opacity-40 cursor-not-allowed"
          }`}
          title={language === "hi" ? "भेजें" : "Send"}
        >
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
        </button>
      </form>

      {/* SUBTLE HAIRLINE DIVIDER */}
      <div className={`my-2 border-t ${isDark ? "border-zinc-800/70" : "border-stone-200/80"}`} />

      {/* 2. BOTTOM PART: Action Buttons Row (Exact match to Screenshot 1) */}
      <div className="flex items-center justify-between px-1">
        
        {/* LEFT: Microphone Pill with Visualizer Frequency Bars & Caret */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all cursor-pointer ${
            !isMicMuted && isCallConnected
              ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
              : isDark
              ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
          }`}
          title={language === "hi" ? (!isMicMuted ? "माइक म्यूट करें" : "माइक अनम्यूट करें") : (!isMicMuted ? "Mute Microphone" : "Unmute Microphone")}
        >
          {!isMicMuted && isCallConnected ? (
            <>
              <Mic className="size-3.5 text-rose-500" />
              {/* Frequency Audio Visualizer Bars */}
              <span className="flex items-center gap-0.5 mx-0.5">
                <span className="w-0.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="w-0.5 h-4 bg-rose-500 rounded-full animate-bounce" />
                <span className="w-0.5 h-2 bg-rose-500 rounded-full animate-pulse" />
              </span>
              <span className="h-3 w-px bg-rose-500/30 mx-0.5" />
              <ChevronDown className="size-3 text-rose-500" />
            </>
          ) : (
            <>
              <MicOff className="size-3.5 text-rose-400" />
              <span className="h-3 w-px bg-zinc-700 mx-0.5" />
              <ChevronDown className="size-3 text-zinc-500" />
            </>
          )}
        </button>

        {/* MIDDLE: Chat / Transcript Toggle Button (Blue Pill when active like Screenshot 1) */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`flex size-9 items-center justify-center rounded-full transition-all cursor-pointer ${
            isChatOpen
              ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40 shadow-xs"
              : isDark
              ? "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
          }`}
          title={language === "hi" ? (isChatOpen ? "बातचीत छुपाएं" : "बातचीत देखें") : (isChatOpen ? "Hide Transcript" : "View Transcript")}
        >
          <MessageSquare className="size-4" />
        </button>

        {/* RIGHT: End Call vs Start Call Button (Exact match to Screenshot 1) */}
        {isCallConnected ? (
          <button
            type="button"
            onClick={onEndCall}
            className="flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title={language === "hi" ? "कॉल समाप्त करें" : "End Call"}
          >
            <PhoneOff className="size-3.5" />
            <span>{language === "hi" ? "समाप्त" : "END"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartCall}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title={language === "hi" ? "कॉल शुरू करें" : "Start Call"}
          >
            <PhoneCall className="size-3.5" />
            <span>{language === "hi" ? "कॉल" : "CALL"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
