// Provide global audio access and playback control
import { createContext, useContext, useRef, useEffect, useState } from "react";
import { isDebugMode } from "../helpers/isDebugMode";
import audioData from "../data/audio.json";

const AudioContext = createContext();

// Keep an external reference so helpers can trigger UI sounds outside React
let externalPlayUISound = () => {};

export function AudioProvider({ children }) {
  // Keep a single Audio object for background music
  const musicRef = useRef(null);

  // Keep a separate Audio object for ambience layer
  const ambienceRef = useRef(null);

  // Keep reference to running fade interval for ambience
  const ambienceFadeRef = useRef(null);

  // Keep a Set of active one-shot SFX Audio objects
  const sfxRefs = useRef(new Set());

  // Keep a dictionary of preloaded UI Audio bases (cloned at play time)
  const uiRefs = useRef({});

  // Track mute state and persist in localStorage
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("audioMuted") === "true";
    } catch {
      return false;
    }
  });

  // Load the main menu track once
  useEffect(() => {
    const track = audioData.music?.mainMenu;
    if (!track) {
      console.warn("AudioContext: Missing mainMenu track");
      return;
    }

    const path = `/assets/audio/${track}`;
    if (isDebugMode()) {
      console.log(`[Audio] Preparing main menu music: ${path}`);
    }

    const audio = new Audio(path);
    audio.loop = true;
    audio.volume = isMuted ? 0 : 1.0;
    audio.preload = "auto";
    musicRef.current = audio;

    // Clean up on unmount
    return () => {
      audio.pause();
      musicRef.current = null;
    };
  }, []);

  // Preload UI sounds for instant playback
  useEffect(() => {
    const entries = Object.entries(audioData.ui || {});
    if (entries.length === 0) return;

    entries.forEach(([key, file]) => {
      const path = `/assets/audio/${file}`;
      const base = new Audio(path);
      base.preload = "auto";
      uiRefs.current[key] = base;
      if (isDebugMode()) {
        console.log(`[Audio] Preloaded UI sound: ${key} (${path})`);
      }
    });

    // Clean up base refs on unmount
    return () => {
      uiRefs.current = {};
    };
  }, []);

  // Update volume and persist mute setting when state changes
  useEffect(() => {
    const music = musicRef.current;
    const ambience = ambienceRef.current;
    if (music) music.volume = isMuted ? 0 : 1.0;
    if (ambience) ambience.volume = isMuted ? 0 : 1.0;
    try {
      localStorage.setItem("audioMuted", isMuted);
    } catch {}

    if (isDebugMode()) {
      console.log(`[Audio] Mute state changed: ${isMuted ? "ON" : "OFF"}`);
    }
  }, [isMuted]);

  // Start playing main menu track from the beginning
  const playMainMenuMusic = () => {
    stopAmbience(true); // Immediate stop, no fade
    const audio = musicRef.current;
    if (!audio) return;

    if (isDebugMode()) {
      console.log("[Audio] Playing main menu music");
    }

    audio.currentTime = 0;
    audio.volume = isMuted ? 0 : 1.0;
    audio.play().catch(() => {});
  };

  // Gradually fade out and stop music
  const stopMusic = () => {
    const audio = musicRef.current;
    if (!audio) return Promise.resolve();

    if (isDebugMode()) {
      console.log("[Audio] Fading out main menu music");
    }

    const FADE_DURATION = 800; // ms
    const STEP_INTERVAL = 50;
    const steps = FADE_DURATION / STEP_INTERVAL;
    const volumeStep = audio.volume / steps;

    return new Promise((resolve) => {
      const fade = setInterval(() => {
        if (!audio) {
          clearInterval(fade);
          resolve();
          return;
        }

        audio.volume = Math.max(0, audio.volume - volumeStep);

        if (audio.volume <= 0.01) {
          clearInterval(fade);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = isMuted ? 0 : 1.0;
          if (isDebugMode()) {
            console.log("[Audio] Main menu music stopped");
          }
          resolve();
        }
      }, STEP_INTERVAL);
    });
  };

  // Play ambience layer by key name
  const playAmbience = async (key) => {
    const file = audioData.ambience?.[key];
    if (!file) {
      console.warn(`AudioContext: Missing ambience key '${key}'`);
      return;
    }

    const path = `/assets/audio/${file}`;
    if (isDebugMode()) {
      console.log(`[Audio] Starting ambience: ${key} (${path})`);
    }

    // Fade out previous ambience if one is already playing
    if (ambienceRef.current) {
      await stopAmbience();
    }

    // Create and start new ambience loop
    const audio = new Audio(path);
    audio.loop = true;
    audio.preload = "auto";
    ambienceRef.current = audio;

    // Start silent for fade-in
    audio.volume = 0;
    audio.play().catch(() => {});

    // Smoothly fade in ambience if not muted
    if (!isMuted) {
      const FADE_DURATION = 800; // ms
      const STEP_INTERVAL = 50;
      const steps = FADE_DURATION / STEP_INTERVAL;
      const volumeStep = 1.0 / steps;
      let currentVolume = 0;

      // Cancel previous fade interval if still running
      if (ambienceFadeRef.current) {
        clearInterval(ambienceFadeRef.current);
        ambienceFadeRef.current = null;
      }

      ambienceFadeRef.current = setInterval(() => {
        if (!audio) {
          clearInterval(ambienceFadeRef.current);
          ambienceFadeRef.current = null;
          return;
        }
        currentVolume = Math.min(1.0, currentVolume + volumeStep);
        audio.volume = currentVolume;
        if (currentVolume >= 1.0) {
          clearInterval(ambienceFadeRef.current);
          ambienceFadeRef.current = null;
          if (isDebugMode()) {
            console.log(`[Audio] Ambience ${key} faded in`);
          }
        }
      }, STEP_INTERVAL);
    }
  };

  // Gradually fade out and stop ambience
  const stopAmbience = (immediate = false) => {
    const audio = ambienceRef.current;
    if (!audio) return Promise.resolve();

    const name = audio.src.split("/").pop();

    if (isDebugMode()) {
      if (immediate) {
        console.log(`[Audio] Stopping ambience immediately: ${name}`);
      } else {
        console.log(`[Audio] Fading out ambience: ${name}`);
      }
    }

    // Cancel any previous fade before starting a new one
    if (ambienceFadeRef.current) {
      clearInterval(ambienceFadeRef.current);
      ambienceFadeRef.current = null;
    }

    // Immediate stop option (used when switching to main menu)
    if (immediate) {
      audio.pause();
      audio.currentTime = 0;
      ambienceRef.current = null;
      if (isDebugMode()) {
        console.log(`[Audio] Ambience ${name} stopped instantly`);
      }
      return Promise.resolve();
    }

    const FADE_DURATION = 800;
    const STEP_INTERVAL = 50;
    const steps = FADE_DURATION / STEP_INTERVAL;
    const volumeStep = audio.volume / steps;

    return new Promise((resolve) => {
      ambienceFadeRef.current = setInterval(() => {
        if (!audio) {
          clearInterval(ambienceFadeRef.current);
          ambienceFadeRef.current = null;
          resolve();
          return;
        }

        audio.volume = Math.max(0, audio.volume - volumeStep);

        if (audio.volume <= 0.01) {
          clearInterval(ambienceFadeRef.current);
          ambienceFadeRef.current = null;
          audio.pause();
          audio.currentTime = 0;
          ambienceRef.current = null;
          if (isDebugMode()) {
            console.log(`[Audio] Ambience ${name} fully stopped`);
          }
          resolve();
        }
      }, STEP_INTERVAL);
    });
  };

  // Play a short sound effect once, no loop or fade
  const playSFX = (key) => {
    const file = audioData.sfx?.[key];
    if (!file) {
      console.warn(`AudioContext: Missing SFX key '${key}'`);
      return;
    }

    const path = `/assets/audio/${file}`;
    if (isDebugMode()) {
      console.log(`[Audio] Playing SFX: ${key} (${path})`);
    }

    const audio = new Audio(path);
    audio.volume = isMuted ? 0 : 1.0;
    audio.preload = "auto";
    audio.loop = false;

    sfxRefs.current.add(audio);
    audio.play().catch(() => {});
    audio.addEventListener("ended", () => sfxRefs.current.delete(audio));
    audio.addEventListener("error", () => sfxRefs.current.delete(audio));
  };

  // Play a UI sound by key (e.g., "hover" or "click")
  const playUISound = (key) => {
    const base = uiRefs.current[key];
    if (!base) {
      console.warn(`AudioContext: Missing UI sound key '${key}'`);
      return;
    }
    if (isDebugMode()) {
      console.log(`[Audio] UI sound: ${key}`);
    }
    const node = base.cloneNode();
    node.volume = isMuted ? 0 : 0.4;
    node.play().catch(() => {});
  };

  // Clean up all SFX when unmounting
  useEffect(() => {
    return () => {
      sfxRefs.current.forEach((a) => a.pause());
      sfxRefs.current.clear();
    };
  }, []);

  // Toggle mute on or off
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Expose UI player to external helpers
  externalPlayUISound = playUISound;

  return (
    <AudioContext.Provider
      value={{
        playMainMenuMusic,
        stopMusic,
        playAmbience,
        stopAmbience,
        playSFX,
        playUISound,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}

// Get a callable UI player for helper modules
export function getPlayUISound() {
  return externalPlayUISound;
}