export interface GpuGate {
  state: {
    paused: boolean;
    lowPower: boolean;
  };
  frameMs: number;
  dispose: () => void;
}

export function attachGpuGate(canvas: HTMLCanvasElement): GpuGate {
  const gate: GpuGate = {
    state: {
      paused: false,
      lowPower: false,
    },
    frameMs: 1000 / 60,
    dispose: () => {
      gate.state.paused = true;
    },
  };

  const handleVisibility = () => {
    gate.state.paused = document.hidden;
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibility);
  }

  const prevDispose = gate.dispose;
  gate.dispose = () => {
    prevDispose();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  };

  return gate;
}

export function deferUntilVisible(element: HTMLElement, callback: () => void): () => void {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    callback();
    return () => {};
  }

  let called = false;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !called) {
        called = true;
        observer.disconnect();
        callback();
      }
    }
  });

  observer.observe(element);
  return () => observer.disconnect();
}

