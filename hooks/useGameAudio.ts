import { useRef, useEffect } from "react";

export const useGameAudio = (isMuted: boolean) => {
  const isMutedRef = useRef(isMuted);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const getAudioCtx = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  const playTone = (
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.2,
    sweepTo?: number,
    delay = 0,
  ) => {
    if (isMutedRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const startAt = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    if (sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(sweepTo, 1),
        startAt + duration,
      );
    }

    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  };

  const sfx = {
    draw: () => playTone(180, 0.08, "triangle", 0.04),
    release: () => playTone(220, 0.16, "sawtooth", 0.14, 700),
    hit: () => playTone(150, 0.12, "square", 0.18, 60),
    bullseye: () => {
      playTone(523, 0.12, "sine", 0.22, 1046);
      playTone(659, 0.16, "sine", 0.18, 0, 0.07);
      playTone(784, 0.2, "sine", 0.14, 0, 0.14);
    },
    miss: () => playTone(90, 0.28, "sawtooth", 0.1, 40),
    streakBreak: () => playTone(180, 0.22, "sawtooth", 0.12, 70),
    close: () => playTone(300, 0.14, "sine", 0.1, 200),
  };

  const vibrate = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore on unsupported devices
    }
  };

  return { sfx, vibrate };
};
