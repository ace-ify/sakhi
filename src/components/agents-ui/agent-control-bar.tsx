"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, MessageSquareText, PhoneOff, PhoneCall, SendHorizontal, ChevronDown, Loader2 } from "lucide-react";

export interface AgentControlBarProps {
  isTextInputOpen: boolean;
  isChatTranscriptOpen: boolean;
  isCallConnected: boolean;
  isMicMuted: boolean;
  onToggleMic: () => void;
  onToggleChatButton: () => void; // Clicked the chat button
  onStartCall: () => void;
  onEndCall: () => void;
  onSendMessage: (message: string) => void;
  isDark?: boolean;
  language?: "hi" | "en";
}

export function AgentControlBar({
  isTextInputOpen = false,
  isChatTranscriptOpen = false,
  isCallConnected = true,
  isMicMuted = false,
  onToggleMic,
  onToggleChatButton,
  onStartCall,
  onEndCall,
  onSendMessage,
  isDark = true,
  language = "hi",
}: AgentControlBarProps) {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTextInputOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isTextInputOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      onSendMessage(inputText.trim());
      setInputText("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`w-full flex flex-col rounded-[32px] border transition-all duration-300 shadow-2xl ${
        isDark
          ? "bg-[#161619] border-zinc-800/90 text-zinc-100"
          : "bg-white border-stone-200 text-stone-900"
      } ${isTextInputOpen ? "p-3 pb-3" : "p-2 px-3"}`}
    >
      {/* 1. EXPANDABLE TEXT INPUT (Only appears when Chat button is toggled ON!) */}
      <div
        className={`w-full overflow-hidden transition-all duration-300 ease-out ${
          isTextInputOpen ? "max-h-24 opacity-100 mb-2" : "max-h-0 opacity-0 pointer-events-none mb-0"
        }`}
      >
        <form onSubmit={handleSend} className="flex items-center justify-between gap-2 px-2 pt-1 pb-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={language === "hi" ? "कुछ लिखें..." : "Type something..."}
            className={`flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-500 font-normal ${
              isDark ? "text-zinc-100" : "text-stone-900"
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`flex size-8 shrink-0 items-center justify-center transition-all cursor-pointer ${
              inputText.trim()
                ? isDark
                  ? "text-zinc-200 hover:text-white"
                  : "text-stone-800 hover:text-stone-950"
                : "text-zinc-500 opacity-40 cursor-not-allowed"
            }`}
            title={language === "hi" ? "भेजें" : "Send"}
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4 text-current" strokeWidth={1.8} />
            )}
          </button>
        </form>

        {/* Thin divider line between text input and button row (Exact match to Screenshot 1) */}
        <div className={`mt-2 border-t ${isDark ? "border-zinc-800/80" : "border-stone-200/80"}`} />
      </div>

      {/* 2. BUTTONS ROW (Pixel-perfect match to Screenshot 1) */}
      <div className="flex items-center justify-between w-full">
        
        {/* LEFT: Microphone Pill with Visualizer / Mute & Chevron */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 transition-all cursor-pointer border ${
            isMicMuted
              ? isDark
                ? "bg-rose-950/40 text-rose-400 border-rose-900/50 hover:bg-rose-950/60"
                : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
              : isDark
              ? "bg-[#202025] text-zinc-200 border-zinc-700/80 hover:bg-[#282830]"
              : "bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200"
          }`}
          title={isMicMuted ? (language === "hi" ? "माइक चालू करें" : "Unmute Microphone") : (language === "hi" ? "माइक बंद करें" : "Mute Microphone")}
        >
          {isMicMuted ? (
            <MicOff className="size-4 text-rose-500" strokeWidth={2} />
          ) : (
            <div className="flex items-center gap-1">
              <Mic className="size-4 text-current" strokeWidth={2} />
              {/* Audio Equalizer Frequency Bars */}
              {isCallConnected && (
                <span className="flex items-center gap-0.5 ml-0.5">
                  <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-bounce" />
                  <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                </span>
              )}
            </div>
          )}
          <span className={`h-3 w-px ${isDark ? "bg-zinc-700" : "bg-stone-300"} mx-0.5`} />
          <ChevronDown className="size-3.5 text-current opacity-70" strokeWidth={2} />
        </button>

        {/* MIDDLE: Chat / Transcript Toggle Button (Blue Pill when active like Screenshot 1) */}
        <button
          type="button"
          onClick={onToggleChatButton}
          className={`flex size-10 items-center justify-center rounded-full transition-all cursor-pointer border ${
            isTextInputOpen || isChatTranscriptOpen
              ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-xs"
              : isDark
              ? "bg-[#202025] text-zinc-300 border-zinc-800 hover:bg-[#282830] hover:text-white"
              : "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
          }`}
          title={language === "hi" ? "चैट" : "Chat"}
        >
          <MessageSquareText className="size-4" strokeWidth={1.8} />
        </button>

        {/* RIGHT: End Call vs Call Button (Exact match to Screenshot 1) */}
        {isCallConnected ? (
          <button
            type="button"
            onClick={onEndCall}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
              isDark
                ? "bg-rose-950/40 text-rose-400 border-rose-900/60 hover:bg-rose-950/70"
                : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
            }`}
            title={language === "hi" ? "कॉल समाप्त करें" : "End Call"}
          >
            <PhoneOff className="size-3.5 text-rose-500" strokeWidth={2.2} />
            <span className="tracking-wide">END</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartCall}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
              isDark
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-950/70"
                : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
            }`}
            title={language === "hi" ? "कॉल शुरू करें" : "Start Call"}
          >
            <PhoneCall className="size-3.5 text-emerald-500" strokeWidth={2.2} />
            <span className="tracking-wide">CALL</span>
          </button>
        )}
      </div>
    </div>
  );
}
