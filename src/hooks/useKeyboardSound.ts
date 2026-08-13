import { useCallback, useEffect, useRef } from "react";

export function useKeyboardSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => () => {
    void contextRef.current?.close();
    contextRef.current = null;
  }, []);

  return useCallback((key: string) => {
    if (!enabled || typeof AudioContext === "undefined") return;

    const context = contextRef.current ?? new AudioContext();
    contextRef.current = context;
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const isControlKey = key === "Backspace" || key === "Enter";

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(isControlKey ? 125 : 175 + Math.random() * 18, now);
    oscillator.frequency.exponentialRampToValueAtTime(isControlKey ? 72 : 110, now + 0.028);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(isControlKey ? 0.035 : 0.022, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.04);
  }, [enabled]);
}
