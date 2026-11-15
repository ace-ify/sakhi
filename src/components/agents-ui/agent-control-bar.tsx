"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, MessageSquare, PhoneOff, SendHorizontal, Loader2 } from "lucide-react";

export interface AgentControlBarProps {
  variant?: "default" | "outline" | "livekit";
  isChatOpen?: boolean;
  isConnected?: boolean;
  isMicMuted?: boolean;
  onToggleMic?: () => void;
  onToggleChat?: () => void;
  onDisconnect?: () => void;
  onSendMessage?: (message: string) => void;
  controls?: {
    microphone?: boolean;
    chat?: boolean;
    leave?: boolean;
    camera?: boolean;
    screenShare?: boolean;
  };
  isDark?: boolean;
  language?: "hi" | "en";
}

export function AgentControlBar({
  variant = "livekit",
  isChatOpen = false,
  isConnected = true,
  isMicMuted = false,
  onToggleMic,
  onToggleChat,
  onDisconnect,
  onSendMessage,
  controls = {
    microphone: true,
    chat: true,
    leave: true,
    camera: false,
    screenShare: false,
  },
  isDark = true,
  language = "hi",
}: AgentControlBarProps) {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      inputRef.current?.focus();
    }
  }, [isChatOpen]);

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

  const showMic = controls.microphone !== false;
  const showChat = controls.chat !== false;
  const showLeave = controls.leave !== false;

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* Expandable Text Input (Shown when Chat is toggled open) */}
      {isChatOpen && (
        <form
          onSubmit={handleSend}
          className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-1.5 shadow-sm transition-all duration-200 ${
            isDark
              ? "bg-[#1e1e22] border-zinc-700/80 focus-within:border-zinc-500"
              : "bg-white border-stone-300 focus-within:border-stone-500"
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={language === "hi" ? "सखी से पूछें..." : "Type to Sakhi..."}
            className={`flex-1 bg-transparent text-xs focus:outline-none ${
              isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-stone-900 placeholder:text-stone-400"
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`flex size-7 items-center justify-center rounded-xl transition-all cursor-pointer ${
              !inputText.trim()
                ? "opacity-30 cursor-not-allowed text-zinc-500"
                : "bg-rose-600 text-white hover:bg-rose-500 shadow-xs"
            }`}
          >
            {isSending ? <Loader2 className="size-3.5 animate-spin" /> : <SendHorizontal className="size-3.5" />}
          </button>
        </form>
      )}

      {/* Official LiveKit Style 3-Button Control Bar */}
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border p-1.5 shadow-lg backdrop-blur-md transition-all ${
          isDark
            ? "bg-[#18181c]/95 border-zinc-800 text-zinc-200"
            : "bg-white/95 border-stone-200 text-stone-800"
        }`}
      >
        {/* 1. Microphone Button (Mute/Unmute) */}
        {showMic && (
          <button
            type="button"
            onClick={onToggleMic}
            className={`relative flex size-10 items-center justify-center rounded-full transition-all cursor-pointer ${
              !isMicMuted
                ? isDark
                  ? "bg-zinc-800 text-white hover:bg-zinc-700 ring-2 ring-emerald-500/30"
                  : "bg-stone-100 text-stone-900 hover:bg-stone-200 ring-2 ring-emerald-500/30"
                : "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
            }`}
            title={!isMicMuted ? "Mute Microphone" : "Unmute Microphone"}
          >
            {!isMicMuted ? (
              <>
                <Mic className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </>
            ) : (
              <MicOff className="size-4" />
            )}
          </button>
        )}

        {/* 2. Chat Toggle Button */}
        {showChat && (
          <button
            type="button"
            onClick={onToggleChat}
            className={`flex size-10 items-center justify-center rounded-full transition-all cursor-pointer ${
              isChatOpen
                ? "bg-rose-600 text-white shadow-xs"
                : isDark
                ? "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900"
            }`}
            title={isChatOpen ? "Close Chat Transcript" : "Open Chat Transcript"}
          >
            <MessageSquare className="size-4" />
          </button>
        )}

        {/* 3. Leave / Disconnect Button */}
        {showLeave && (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex size-10 items-center justify-center rounded-full bg-rose-600/90 hover:bg-rose-600 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title="Disconnect Voice Session"
          >
            <PhoneOff className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
