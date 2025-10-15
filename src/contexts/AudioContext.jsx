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
    audio.play().catch(() => {});
  };

  // Stop any active background music
  const stopMusic = () => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
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