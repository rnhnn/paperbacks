// Provide global audio controls for background music and sound effects
import { createContext, useContext, useRef, useEffect, useState } from "react";
import audioData from "../data/audio.json";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  // Hold a single persistent audio element for background music
  const musicRef = useRef(null);

  // Track mute preference across sessions
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("paperbacks_audio_muted") === "true";
    } catch {
      return false;
    }
  });

  // Initialize and preload the main menu track once on mount
  useEffect(() => {
    const defaultTrack = audioData.music?.mainMenu;
    if (!defaultTrack) {
      console.warn("Audio manifest missing music.mainMenu entry");
      return;
    }

    const audio = new Audio(`/assets/audio/${defaultTrack}`);
    audio.loop = true;
    audio.volume = isMuted ? 0 : 0.6;
    audio.preload = "auto"; // Request early download during loading
    musicRef.current = audio;

    try {
      audio.load(); // Starts network request even before play()
    } catch (err) {
      console.warn("Audio preload failed:", err);
    }

    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = "";
        musicRef.current = null;
      }
    };
    // Run once: do NOT depend on isMuted
  }, []);

  // Keep volume in sync with mute preference without recreating the element
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : 0.6;
  }, [isMuted]);

  // Smoothly interpolate volume to a target level
  const fade = (targetVolume, duration = 1000) =>
    new Promise((resolve) => {
      const audio = musicRef.current;
      if (!audio) return resolve();

      const startVolume = audio.volume;
      const startTime = performance.now();

      const step = () => {
        const progress = Math.min((performance.now() - startTime) / duration, 1);
        audio.volume = startVolume + (targetVolume - startVolume) * progress;
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      };

      step();
    });

  // Play the specified music track immediately
  const playMusic = async (name = "mainMenu") => {
    const file = audioData.music?.[name];
    const audio = musicRef.current;
    if (!audio || !file) {
      console.warn(`Missing music track: ${name}`);
      return;
    }

    // Always reset when switching or resuming menu
    if (!audio.src.endsWith(file)) {
      audio.src = `/assets/audio/${file}`;
      audio.load();
      audio.currentTime = 0;
    } else if (name === "mainMenu") {
      audio.currentTime = 0;
    }

    // Respect mute state before playing
    audio.volume = isMuted ? 0 : 0.6;

    // Only start playback if not muted
    if (!isMuted && audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        console.warn("Audio play failed:", err);
      }
    }
  };

  // Fade out and stop current background track
  const stopMusic = async () => {
    const audio = musicRef.current;
    if (!audio) return;
    await fade(0, 800);
    audio.pause();
    audio.currentTime = 0;
  };

  // Fade out background music (used for transitions, not muting)
  const fadeOutMusic = async (resetAfter = false) => {
    const audio = musicRef.current;
    if (!audio) return;
    await fade(0.0, 400);
    if (resetAfter) {
      audio.pause();
      audio.currentTime = 0; // Ensures restart next time
    }
  };

  // Fade in background music (used when resuming or returning to menu)
  const fadeInMusic = async () => {
    const audio = musicRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play();
    await fade(0.6, 400);
  };

  // Play a short one-shot sound effect without interrupting music
  const playSfx = (name) => {
    const file = audioData.sfx?.[name];
    if (!file) {
      console.warn(`Missing SFX: ${name}`);
      return;
    }
    const sfx = new Audio(`/assets/audio/${file}`);
    sfx.volume = isMuted ? 0 : 0.6;
    sfx.play();
  };

  // Expose controls globally
  return (
    <AudioContext.Provider
      value={{ playMusic, stopMusic, fadeInMusic, fadeOutMusic, playSfx, isMuted }}
    >
      {children}
    </AudioContext.Provider>
  );
}

// Access global audio controls from any component
export function useAudio() {
  return useContext(AudioContext);
}