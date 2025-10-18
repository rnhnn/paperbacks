// Provide global audio access and playback control
import { createContext, useContext, useRef, useEffect, useState } from "react";
import audioData from "../data/audio.json";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  // Keep a single Audio object for background music
  const musicRef = useRef(null);

  // Keep a separate Audio object for ambience layer
  const ambienceRef = useRef(null);

  // Keep reference to running fade interval for ambience
  const ambienceFadeRef = useRef(null);

  // Keep a Set of active one-shot SFX Audio objects
  const sfxRefs = useRef(new Set());

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
    const audio = new Audio(`/assets/audio/${track}`);
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

  // Update volume and persist mute setting when state changes
  useEffect(() => {
    const music = musicRef.current;
    const ambience = ambienceRef.current;
    if (music) music.volume = isMuted ? 0 : 1.0;
    if (ambience) ambience.volume = isMuted ? 0 : 1.0;
    try {
      localStorage.setItem("audioMuted", isMuted);
    } catch {}
  }, [isMuted]);

  // Start playing main menu track from the beginning
  const playMainMenuMusic = () => {
    // Ensure ambience is completely stopped when menu music begins
    stopAmbience(true); // Immediate stop, no fade

    const audio = musicRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = isMuted ? 0 : 1.0;
    audio.play().catch(() => {});
  };

  // Gradually fade out and stop music
  const stopMusic = () => {
    const audio = musicRef.current;
    if (!audio) return Promise.resolve();

    // Define fade duration and frame rate
    const FADE_DURATION = 800; // ms
    const STEP_INTERVAL = 50; // ms between volume steps
    const steps = FADE_DURATION / STEP_INTERVAL;
    const volumeStep = audio.volume / steps;

    // Return a Promise that resolves after fade completes
    return new Promise((resolve) => {
      const fade = setInterval(() => {
        if (!audio) {
          clearInterval(fade);
          resolve();
          return;
        }

        // Decrease volume until silent
        audio.volume = Math.max(0, audio.volume - volumeStep);

        // Stop and reset once volume is near zero
        if (audio.volume <= 0.01) {
          clearInterval(fade);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = isMuted ? 0 : 1.0;
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

    // Wait for any previous ambience to fade out before replacing
    if (ambienceRef.current) {
      await stopAmbience();
    }

    // Create and start new ambience loop
    const audio = new Audio(`/assets/audio/${file}`);
    audio.loop = true;
    audio.volume = isMuted ? 0 : 1.0;
    audio.preload = "auto";
    ambienceRef.current = audio;
    audio.play().catch(() => {});
  };

  // Gradually fade out and stop ambience
  const stopAmbience = (immediate = false) => {
    const audio = ambienceRef.current;
    if (!audio) return Promise.resolve();

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
      return Promise.resolve();
    }

    // Define fade duration and frame rate
    const FADE_DURATION = 800; // ms
    const STEP_INTERVAL = 50; // ms between volume steps
    const steps = FADE_DURATION / STEP_INTERVAL;
    const volumeStep = audio.volume / steps;

    // Return a Promise that resolves after fade completes
    return new Promise((resolve) => {
      ambienceFadeRef.current = setInterval(() => {
        if (!audio) {
          clearInterval(ambienceFadeRef.current);
          ambienceFadeRef.current = null;
          resolve();
          return;
        }

        // Decrease volume until silent
        audio.volume = Math.max(0, audio.volume - volumeStep);

        // Stop and reset once volume is near zero
        if (audio.volume <= 0.01) {
          clearInterval(ambienceFadeRef.current);
          ambienceFadeRef.current = null;
          audio.pause();
          audio.currentTime = 0;
          ambienceRef.current = null;
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

    // Create a temporary audio instance
    const audio = new Audio(`/assets/audio/${file}`);
    audio.volume = isMuted ? 0 : 1.0;
    audio.preload = "auto";
    audio.loop = false;

    // Track this instance to avoid leaks
    sfxRefs.current.add(audio);

    // Play and clean up when done
    audio.play().catch(() => {});
    audio.addEventListener("ended", () => {
      sfxRefs.current.delete(audio);
    });
    audio.addEventListener("error", () => {
      sfxRefs.current.delete(audio);
    });
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

  return (
    <AudioContext.Provider
      value={{
        playMainMenuMusic,
        stopMusic,
        playAmbience,
        stopAmbience,
        playSFX,
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