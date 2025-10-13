// Provide global audio controls for background music and sound effects
import { createContext, useContext, useRef, useEffect } from "react";
import audioData from "../data/audio.json";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  // Hold a single persistent audio element for background music
  const musicRef = useRef(null);

  // Initialize and preload the main menu track once on mount
  useEffect(() => {
    const defaultTrack = audioData.music?.mainMenu;
    if (!defaultTrack) {
      console.warn("Audio manifest missing music.mainMenu entry");
      return;
    }

    const audio = new Audio(`/assets/audio/${defaultTrack}`);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto"; // Request early download during loading
    musicRef.current = audio;

    // Force immediate buffering for extra reliability
    try {
      audio.load(); // Starts network request even before play()
    } catch (err) {
      console.warn("Audio preload failed:", err);
    }
  }, []);

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

    // Reload only if switching tracks
    if (!audio.src.endsWith(file)) {
      audio.src = `/assets/audio/${file}`;
      audio.load();
    }

    audio.volume = 0.6;
    if (audio.paused) await audio.play();
  };

  // Fade out and stop current background track
  const stopMusic = async () => {
    const audio = musicRef.current;
    if (!audio) return;
    await fade(0, 800);
    audio.pause();
    audio.currentTime = 0;
  };

  // Play a short one-shot sound effect without interrupting music
  const playSfx = (name) => {
    const file = audioData.sfx?.[name];
    if (!file) {
      console.warn(`Missing SFX: ${name}`);
      return;
    }
    const sfx = new Audio(`/assets/audio/${file}`);
    sfx.volume = 0.6;
    sfx.play();
  };

  return (
    <AudioContext.Provider value={{ playMusic, stopMusic, playSfx }}>
      {children}
    </AudioContext.Provider>
  );
}

// Access global audio controls from any component
export function useAudio() {
  return useContext(AudioContext);
}