"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  MessageSquareText,
  PhoneOff,
  PhoneCall,
  SendHorizontal,
  ChevronDown,
  Loader2,
  Check,
  Volume2,
} from "lucide-react";

export interface AgentControlBarProps {
  isTextInputOpen: boolean;
  isChatTranscriptOpen: boolean;
  isCallConnected: boolean;
  isMicMuted: boolean;
  onToggleMic: () => void;
  onToggleChatButton: () => void;
  onStartCall: () => void;
  onEndCall: () => void;
  onSendMessage: (message: string) => void;
  isDark?: boolean;
  language?: "hi" | "en";
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

/**
 * Real Audio Visualizer Bars
 * Taps into Web Audio API AnalyserNode when available,
 * with an organic reactive fallback for instantaneous fluid motion.
 */
function RealAudioEqualizer({
  isActive,
  isDark,
}: {
  isActive: boolean;
  isDark: boolean;
}) {
  const [levels, setLevels] = useState<number[]>([4, 7, 10, 5]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setLevels([3, 4, 3, 4]);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let usingLiveMic = false;

    // Try acquiring real microphone stream
    const initMic = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.6;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          sourceRef.current = source;
          usingLiveMic = true;
        }
      } catch {
        // Fallback to organic synthetic waveform if mic access was rejected / not available
        usingLiveMic = false;
      }

      // Render loop
      let step = 0;
      const dataArray = new Uint8Array(32);

      const update = () => {
        if (!isMounted) return;
        step += 0.08;

        if (usingLiveMic && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Pick 4 frequency bands: Low, Mid-Low, Mid-High, High
          const b1 = Math.max(3, Math.min(16, (dataArray[2] / 255) * 16));
          const b2 = Math.max(4, Math.min(16, (dataArray[5] / 255) * 18));
          const b3 = Math.max(3, Math.min(16, (dataArray[9] / 255) * 16));
          const b4 = Math.max(3, Math.min(16, (dataArray[14] / 255) * 14));
          setLevels([b1, b2, b3, b4]);
        } else {
          // Smooth organic reactive oscillation
          const s1 = 3 + Math.abs(Math.sin(step * 1.5)) * 8 + Math.cos(step * 0.7) * 2;
          const s2 = 4 + Math.abs(Math.sin(step * 2.1 + 0.5)) * 11;
          const s3 = 3 + Math.abs(Math.cos(step * 1.8 + 1.2)) * 9;
          const s4 = 3 + Math.abs(Math.sin(step * 2.7)) * 7;
          setLevels([
            Math.max(3, Math.min(16, s1)),
            Math.max(4, Math.min(16, s2)),
            Math.max(3, Math.min(16, s3)),
            Math.max(3, Math.min(16, s4)),
          ]);
        }

        animFrameRef.current = requestAnimationFrame(update);
      };

      animFrameRef.current = requestAnimationFrame(update);
    };

    initMic();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isActive]);

  return (
    <div className="flex items-center gap-[2px] h-4 px-0.5">
      {levels.map((lvl, idx) => (
        <span
          key={idx}
          style={{ height: `${lvl}px` }}
          className={`w-[2.5px] rounded-full transition-[height] duration-75 ${
            isDark ? "bg-emerald-400" : "bg-emerald-600"
          }`}
        />
      ))}
    </div>
  );
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
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [devices, setDevices] = useState<AudioDevice[]>([
    { deviceId: "default", label: language === "hi" ? "डिफ़ॉल्ट माइक्रोफ़ोन" : "Default Microphone" },
    { deviceId: "headset", label: language === "hi" ? "ईयरफ़ोन / हेडसेट" : "Headset / Earphones" },
  ]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Focus input when text input opens
  useEffect(() => {
    if (isTextInputOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isTextInputOpen]);

  // Load available audio input devices
  const loadAudioDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devList = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devList
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({
            deviceId: d.deviceId || `device-${i}`,
            label: d.label || (language === "hi" ? `माइक्रोफ़ोन ${i + 1}` : `Microphone ${i + 1}`),
          }));

        if (audioInputs.length > 0) {
          setDevices(audioInputs);
          if (!selectedDeviceId || selectedDeviceId === "default") {
            setSelectedDeviceId(audioInputs[0].deviceId);
          }
        }
      }
    } catch {
      // Use predefined fallback devices
    }
  }, [language, selectedDeviceId]);

  useEffect(() => {
    loadAudioDevices();
  }, [loadAudioDevices]);

  // Close device popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsDeviceMenuOpen(false);
      }
    };
    if (isDeviceMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDeviceMenuOpen]);

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
      className={`relative w-full flex flex-col rounded-[32px] border transition-all duration-300 shadow-2xl ${
        isDark
          ? "bg-[#161619] border-zinc-800/90 text-zinc-100"
          : "bg-white border-stone-200 text-stone-900"
      } ${isTextInputOpen ? "p-3 pb-3" : "p-2 px-3"}`}
    >
      {/* DEVICE SELECTION POPOVER */}
      {isDeviceMenuOpen && (
        <div
          ref={popoverRef}
          className={`absolute bottom-full left-2 mb-2 w-64 rounded-2xl border p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            isDark
              ? "bg-[#1c1c21] border-zinc-700/80 text-zinc-100 shadow-black/80"
              : "bg-white border-stone-200 text-stone-900 shadow-stone-400/30"
          }`}
        >
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-zinc-700/40 mb-1">
            <Volume2 className="size-3.5 text-zinc-400" />
            <span className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
              {language === "hi" ? "ऑडियो इनपुट चुनें" : "Select Audio Input"}
            </span>
          </div>
          <div className="space-y-1">
            {devices.map((device) => {
              const isSelected = selectedDeviceId === device.deviceId;
              return (
                <button
                  key={device.deviceId}
                  type="button"
                  onClick={() => {
                    setSelectedDeviceId(device.deviceId);
                    setIsDeviceMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? isDark
                        ? "bg-zinc-800 text-white font-medium"
                        : "bg-stone-100 text-stone-900 font-medium"
                      : isDark
                      ? "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                      : "text-stone-700 hover:bg-stone-100/80 hover:text-stone-950"
                  }`}
                >
                  <span className="truncate">{device.label}</span>
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. EXPANDABLE TEXT INPUT (Appears smoothly when Chat toggle is active) */}
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
            placeholder={language === "hi" ? "सखी से पूछें..." : "Type something..."}
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

        {/* Divider line between input and button controls */}
        <div className={`mt-2 border-t ${isDark ? "border-zinc-800/80" : "border-stone-200/80"}`} />
      </div>

      {/* 2. OFFICIAL LIVEKIT BUTTONS ROW */}
      <div className="flex items-center justify-between w-full">
        {/* LEFT GROUP: Mic with Device Dropdown + Chat Button (Placed next to each other!) */}
        <div className="flex items-center gap-2">
          {/* Mic Split Button */}
          <div
            className={`flex items-center rounded-full border transition-all ${
              isMicMuted
                ? isDark
                  ? "bg-rose-950/40 text-rose-400 border-rose-900/50"
                  : "bg-rose-50 text-rose-600 border-rose-200"
                : isDark
                ? "bg-[#202025] text-zinc-200 border-zinc-700/80"
                : "bg-stone-100 text-stone-800 border-stone-200"
            }`}
          >
            {/* Mic Toggle Action */}
            <button
              type="button"
              onClick={onToggleMic}
              className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:opacity-85 transition-opacity"
              title={
                isMicMuted
                  ? language === "hi"
                    ? "माइक चालू करें"
                    : "Unmute Microphone"
                  : language === "hi"
                  ? "माइक बंद करें"
                  : "Mute Microphone"
              }
            >
              {isMicMuted ? (
                <MicOff className="size-4 text-rose-500" strokeWidth={2} />
              ) : (
                <div className="flex items-center gap-1">
                  <Mic className="size-4 text-current" strokeWidth={2} />
                  {/* Dynamic Real Audio Equalizer */}
                  {isCallConnected && (
                    <RealAudioEqualizer isActive={!isMicMuted} isDark={isDark} />
                  )}
                </div>
              )}
            </button>

            {/* Hairline Divider */}
            <span className={`h-3 w-px ${isDark ? "bg-zinc-700" : "bg-stone-300"}`} />

            {/* Audio Device Dropdown Chevron */}
            <button
              type="button"
              onClick={() => setIsDeviceMenuOpen((prev) => !prev)}
              className="flex items-center justify-center px-2 py-2 cursor-pointer hover:opacity-85 transition-opacity"
              title={language === "hi" ? "ऑडियो इनपुट डिवाइस" : "Audio Input Device"}
            >
              <ChevronDown
                className={`size-3.5 text-current opacity-70 transition-transform duration-200 ${
                  isDeviceMenuOpen ? "rotate-180" : ""
                }`}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Chat / Transcript Toggle Button (Right beside Mic as in LiveKit!) */}
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
            title={language === "hi" ? "चैट / बातचीत" : "Chat / Transcript"}
          >
            <MessageSquareText className="size-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* RIGHT: End Call vs Call Button */}
        <div>
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
    </div>
  );
}
