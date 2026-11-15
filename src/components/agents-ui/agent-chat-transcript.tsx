"use client";

import React, { useRef, useEffect } from "react";
import { Sparkles, Bot, User } from "lucide-react";
import type { VoiceState } from "@/types/voice";

export interface TranscriptMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  time: string;
}

export interface AgentChatTranscriptProps {
  messages: TranscriptMessage[];
  agentState?: VoiceState;
  isDark?: boolean;
  language?: "hi" | "en";
  className?: string;
}

export function AgentChatTranscript({
  messages,
  agentState = "idle",
  isDark = true,
  language = "hi",
  className = "",
}: AgentChatTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentState]);

  return (
    <div className={`flex flex-1 flex-col overflow-y-auto space-y-3 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {messages.map((m) => {
        const isAgent = m.sender === "agent";
        return (
          <div
            key={m.id}
            className={`flex flex-col ${isAgent ? "items-start" : "items-end"} animate-fade-in`}
          >
            <div className="flex items-end gap-1.5 max-w-[88%]">
              {isAgent && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-600/20 text-rose-500 mb-0.5">
                  <Bot className="size-3.5" />
                </div>
              )}

              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  !isAgent
                    ? "bg-rose-600 text-white rounded-br-xs shadow-xs"
                    : isDark
                    ? "bg-[#202025] text-zinc-100 rounded-bl-xs border border-zinc-800/80 shadow-xs"
                    : "bg-white text-stone-800 rounded-bl-xs border border-stone-200 shadow-xs"
                }`}
              >
                {m.text}
              </div>
            </div>

            <span className="text-[9px] text-zinc-500 mt-0.5 px-8">{m.time}</span>
          </div>
        );
      })}

      {/* Live Agent Thinking Indicator */}
      {agentState === "thinking" && (
        <div className="flex items-center gap-2 pl-1 animate-pulse">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <Sparkles className="size-3.5 animate-spin" />
          </div>
          <div
            className={`rounded-xl px-3 py-1.5 text-xs font-mono ${
              isDark ? "bg-[#202025] text-amber-300 border border-amber-500/30" : "bg-stone-100 text-stone-700"
            }`}
          >
            {language === "hi" ? "सखी सोच रही है..." : "Sakhi is thinking..."}
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
}

