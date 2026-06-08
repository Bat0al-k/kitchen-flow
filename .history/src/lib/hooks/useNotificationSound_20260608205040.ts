import { useEffect, useState, useCallback, useRef } from "react";

// Shared global AudioContext so it persists across hooks
let sharedAudioContext: AudioContext | null = null;

export function useNotificationSound() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const saved = window.localStorage.getItem("kitchenflow_sound_muted");
    return saved !== null ? saved === "true" : false;
  });
  const isMutedRef = useRef(isMuted);

  // Sync ref to avoid closure issues in event callbacks
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initialize/Resume AudioContext lazily
  const ensureAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    if (typeof window === "undefined") return null;

    if (!sharedAudioContext) {
      // Lazy initialization on user interaction
      const audioWindow = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioCtx = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
      if (AudioCtx) {
        sharedAudioContext = new AudioCtx();
      }
    }

    if (sharedAudioContext && sharedAudioContext.state === "suspended") {
      await sharedAudioContext.resume();
    }

    return sharedAudioContext;
  }, []);

  // Lazy listener registry to satisfy browser autoplay policy
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAudioOnGesture = async () => {
      try {
        await ensureAudioContext();
        // Remove listeners once successfully initialized
        window.removeEventListener("click", initAudioOnGesture);
        window.removeEventListener("keydown", initAudioOnGesture);
        window.removeEventListener("touchstart", initAudioOnGesture);
        console.log("[useNotificationSound] AudioContext lazily initialized.");
      } catch (err) {
        console.warn("[useNotificationSound] Autoplay initialization failed:", err);
      }
    };

    window.addEventListener("click", initAudioOnGesture);
    window.addEventListener("keydown", initAudioOnGesture);
    window.addEventListener("touchstart", initAudioOnGesture);

    return () => {
      window.removeEventListener("click", initAudioOnGesture);
      window.removeEventListener("keydown", initAudioOnGesture);
      window.removeEventListener("touchstart", initAudioOnGesture);
    };
  }, [ensureAudioContext]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("kitchenflow_sound_muted", String(next));
      return next;
    });
    // Try to trigger AudioContext resume on toggle click
    ensureAudioContext().catch(console.error);
  }, [ensureAudioContext]);

  // Play ascending chime sound for new orders
  const playNewOrderSound = useCallback(async () => {
    if (isMutedRef.current) return;
    try {
      const ctx = await ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Ascending Chime)
      const noteDuration = 0.12;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * noteDuration);

        // ADSR Envelope
        gainNode.gain.setValueAtTime(0, now + index * noteDuration);
        gainNode.gain.linearRampToValueAtTime(0.2, now + index * noteDuration + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * noteDuration + noteDuration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + index * noteDuration);
        osc.stop(now + index * noteDuration + noteDuration);
      });
    } catch (error) {
      console.warn("[useNotificationSound] Could not play new order sound:", error);
    }
  }, [ensureAudioContext]);

  // Play restaurant bell sound for ready orders
  // const playOrderReadySound = useCallback(async () => {
  //   if (isMutedRef.current) return;
  //   try {
  //     const ctx = await ensureAudioContext();
  //     if (!ctx) return;

  //     const now = ctx.currentTime;
  //     const duration = 0.5;
  //     const hitTime = 0.02;
  //     const sustain = 0.18;
  //     const release = duration - hitTime - sustain;
  //     const baseFreq = 880; // A5 restaurant bell tone

  //     const osc1 = ctx.createOscillator();
  //     const osc2 = ctx.createOscillator();
  //     const gain = ctx.createGain();

  //     osc1.type = "triangle";
  //     osc2.type = "sine";
  //     osc1.frequency.setValueAtTime(baseFreq, now);
  //     osc2.frequency.setValueAtTime(baseFreq * 3.5, now);
  //     osc2.detune.setValueAtTime(-20, now);

  //     gain.gain.setValueAtTime(0.0, now);
  //     gain.gain.linearRampToValueAtTime(0.35, now + hitTime);
  //     gain.gain.setTargetAtTime(0.18, now + hitTime, 0.05);
  //     gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  //     osc1.connect(gain);
  //     osc2.connect(gain);
  //     gain.connect(ctx.destination);

  //     osc1.start(now);
  //     osc2.start(now);
  //     osc1.stop(now + duration);
  //     osc2.stop(now + duration);
  //   } catch (error) {
  //     console.warn("[useNotificationSound] Could not play order ready sound:", error);
  //   }
  // }, [ensureAudioContext]);

  return {
    isMuted,
    toggleMute,
    playNewOrderSound,
    playOrderReadySound,
  };
}
