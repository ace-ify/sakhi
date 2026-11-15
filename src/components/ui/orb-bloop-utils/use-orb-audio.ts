import { useEffect, useRef, RefObject } from "react";

export interface AudioAnalyzerData {
  allAvg: number;
  lowAvg: number;
  midAvg: number;
  highAvg: number;
  update: () => void;
}

export function useOrbAudio(
  mode: "ambient" | "mic" | "file",
  audioElement?: RefObject<HTMLAudioElement | null>,
  _audioSrc?: string
) {
  const analyzerRef = useRef<AudioAnalyzerData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let audioCtx: AudioContext | null = null;
    let analyzer: AnalyserNode | null = null;
    let sourceNode: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let isCancelled = false;

    async function initAudio() {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        audioCtx = new AudioContextClass();
        analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 64;
        analyzer.smoothingTimeConstant = 0.8;

        if (mode === "mic") {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (isCancelled || !audioCtx) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          sourceNode = audioCtx.createMediaStreamSource(stream);
          sourceNode.connect(analyzer);
        } else if (mode === "file" && audioElement?.current) {
          sourceNode = audioCtx.createMediaElementSource(audioElement.current);
          sourceNode.connect(analyzer);
          analyzer.connect(audioCtx.destination);
        }

        const buffer = new Uint8Array(analyzer.frequencyBinCount);

        analyzerRef.current = {
          allAvg: 0,
          lowAvg: 0,
          midAvg: 0,
          highAvg: 0,
          update: () => {
            if (!analyzer) return;
            analyzer.getByteFrequencyData(buffer);
            const len = buffer.length;
            if (len === 0) return;

            let sum = 0;
            let lowSum = 0;
            let midSum = 0;
            let highSum = 0;

            const third = Math.floor(len / 3);
            for (let i = 0; i < len; i++) {
              const val = buffer[i];
              sum += val;
              if (i < third) lowSum += val;
              else if (i < third * 2) midSum += val;
              else highSum += val;
            }

            analyzerRef.current!.allAvg = sum / len;
            analyzerRef.current!.lowAvg = third > 0 ? lowSum / third : 0;
            analyzerRef.current!.midAvg = third > 0 ? midSum / third : 0;
            analyzerRef.current!.highAvg = third > 0 ? highSum / (len - third * 2) : 0;
          },
        };
      } catch (err) {
        console.warn("[useOrbAudio] Audio init ignored or permission denied:", err);
      }
    }

    if (mode === "mic" || (mode === "file" && audioElement?.current)) {
      initAudio();
    } else {
      analyzerRef.current = null;
    }

    return () => {
      isCancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (sourceNode) sourceNode.disconnect();
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
      analyzerRef.current = null;
    };
  }, [mode, audioElement]);

  return analyzerRef;
}

export function useCorsAudioSrc(src: string): string {
  return src;
}

