// Provide global audio access and playback control
import { createContext, useContext, useRef, useEffect } from "react";
import audioData from "../data/audio.json";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  // Keep a single Audio object for background music
  const musicRef = useRef(null);

  // Load the main menu track once
  useEffect(() => {
    const track = audioData.music?.mainMenu;
    if (!track) {
      console.warn("AudioContext: Missing mainMenu track");
      return;
    }
    const audio = new Audio(`/assets/audio/${track}`);
    audio.loop = true;
    audio.volume = 1.0;
    audio.preload = "auto";
    musicRef.current = audio;
  }, []);

  // Start playing main menu track from the beginning
  const playMainMenuMusic = () => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 1.0;
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
          audio.volume = 1.0;
          resolve();
        }
      }, STEP_INTERVAL);
    });
  };

  return (
    <AudioContext.Provider value={{ playMainMenuMusic, stopMusic }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}