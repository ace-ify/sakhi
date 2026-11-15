"use client";

import React, { useState, useRef } from "react";
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
    <div className="w-full flex items-center justify-center">
      {/* Unified All-in-One LiveKit Agent Control Bar (Text Input Embedded Inside!) */}
      <div
        className={`flex w-full items-center gap-1.5 rounded-full border p-1 shadow-lg backdrop-blur-md transition-all ${
          isDark
            ? "bg-[#18181c]/95 border-zinc-800 text-zinc-200"
            : "bg-white/95 border-stone-200 text-stone-800"
        }`}
      >
        {/* 1. Microphone Button */}
        {showMic && (
          <button
            type="button"
            onClick={onToggleMic}
            className={`relative flex size-9 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
              !isMicMuted
                ? isDark
                  ? "bg-zinc-800 text-white hover:bg-zinc-700 ring-2 ring-emerald-500/30"
                  : "bg-stone-100 text-stone-900 hover:bg-stone-200 ring-2 ring-emerald-500/30"
                : "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
            }`}
            title={language === "hi" ? (!isMicMuted ? "माइक बंद करें" : "माइक चालू करें") : (!isMicMuted ? "Mute Mic" : "Unmute Mic")}
          >
            {!isMicMuted ? (
              <>
                <Mic className="size-4" />
                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </>
            ) : (
              <MicOff className="size-4" />
            )}
          </button>
        )}

        {/* 2. Embedded Inline Text Input Form */}
        <form onSubmit={handleSend} className="flex flex-1 items-center gap-1 min-w-0 px-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={language === "hi" ? "सखी से पूछें..." : "Ask Sakhi..."}
            className={`w-full bg-transparent text-xs focus:outline-none truncate py-1 ${
              isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-stone-900 placeholder:text-stone-400"
            }`}
          />
          {inputText.trim() && (
            <button
              type="submit"
              disabled={isSending}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-all cursor-pointer shadow-xs"
            >
              {isSending ? <Loader2 className="size-3 animate-spin" /> : <SendHorizontal className="size-3" />}
            </button>
          )}
        </form>

        {/* 3. Chat Transcript Toggle Button */}
        {showChat && (
          <button
            type="button"
            onClick={onToggleChat}
            className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
              isChatOpen
                ? "bg-rose-600 text-white shadow-xs"
                : isDark
                ? "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900"
            }`}
            title={language === "hi" ? (isChatOpen ? "बातचीत छुपाएं" : "बातचीत देखें") : (isChatOpen ? "Hide Chat" : "View Chat")}
          >
            <MessageSquare className="size-4" />
          </button>
        )}

        {/* 4. Leave / Disconnect Button */}
        {showLeave && (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-600/90 hover:bg-rose-600 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title={language === "hi" ? "सत्र समाप्त करें" : "Disconnect"}
          >
            <PhoneOff className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
