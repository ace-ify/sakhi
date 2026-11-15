import { CSSProperties, RefObject } from "react";

export enum BloopState {
  idle = "idle",
  listen = "listen",
  think = "think",
  speak = "speak",
}

export type BloopColor = [number, number, number];

export interface OrbBloopProps {
  audioMode?: "ambient" | "mic" | "file";
  audioElement?: RefObject<HTMLAudioElement | null>;
  audioSrc?: string;
  state?: BloopState;
  bloopColorMain?: BloopColor;
  bloopColorLow?: BloopColor;
  bloopColorMid?: BloopColor;
  bloopColorHigh?: BloopColor;
  size?: number;
  watercolorStrength?: number;
  watercolorAnimated?: boolean;
  className?: string;
  style?: CSSProperties;
}

