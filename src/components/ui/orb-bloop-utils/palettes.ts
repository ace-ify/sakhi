import { BloopColor } from "./types";

export enum BloopPaletteName {
  crimson = "crimson",
  coral = "coral",
  emerald = "emerald",
  blue = "blue",
}

export interface BloopPalette {
  main: BloopColor;
  low: BloopColor;
  mid: BloopColor;
  high: BloopColor;
}

export const BLOOP_PALETTES: Record<BloopPaletteName, BloopPalette> = {
  // Vibrant editorial crimson red matching user reference image
  [BloopPaletteName.crimson]: {
    main: [0.96, 0.15, 0.24],   // #f4263e - vivid cherry red
    low: [0.45, 0.04, 0.08],    // #730a14 - deep rich crimson base
    mid: [0.82, 0.10, 0.18],    // #d11a2e - saturated ruby
    high: [1.0, 0.72, 0.78],    // #ffb8c7 - soft glowing highlight
  },
  [BloopPaletteName.coral]: {
    main: [0.95, 0.35, 0.25],
    low: [0.55, 0.12, 0.08],
    mid: [0.85, 0.25, 0.18],
    high: [1.0, 0.80, 0.70],
  },
  [BloopPaletteName.emerald]: {
    main: [0.15, 0.85, 0.45],
    low: [0.05, 0.35, 0.18],
    mid: [0.10, 0.65, 0.35],
    high: [0.65, 0.98, 0.75],
  },
  [BloopPaletteName.blue]: {
    main: [0.15, 0.50, 0.98],
    low: [0.08, 0.20, 0.65],
    mid: [0.12, 0.38, 0.85],
    high: [0.60, 0.82, 1.0],
  },
};
