// Provide global audio access and playback control
import { createContext, useContext, useRef, useEffect, useState } from "react";
import audioData from "../data/audio.json";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  // Keep a single Audio object for background music
  const musicRef = useRef(null);

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
    const audio = musicRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : 1.0;
    }
    try {
      localStorage.setItem("audioMuted", isMuted);
    } catch {}
  }, [isMuted]);

  // Start playing main menu track from the beginning
  const playMainMenuMusic = () => {
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

  // Toggle mute on or off
  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <AudioContext.Provider
      value={{ playMainMenuMusic, stopMusic, isMuted, toggleMute }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}