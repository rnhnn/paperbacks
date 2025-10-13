// Global styles
import "./styles/Variables.css";
import "./styles/Animations.css";
import "./styles/Globals.css";
import "./styles/Game.css";

// React and context imports
import { useState, useEffect } from "react";
import { InventoryProvider } from "./contexts/InventoryContext";
import { NotesProvider } from "./contexts/NotesContext";
import { FlagsProvider } from "./contexts/FlagsContext";
import { SaveSystemProvider } from "./contexts/SaveSystemContext";
import { AudioProvider } from "./contexts/AudioContext";

// Hooks and components
import useGameScale from "./hooks/useGameScale";
import GameScreen from "./components/GameScreen";

export default function Game() {
  useGameScale(960, 540); // Keep base 960×540 resolution

  const [phase, setPhase] = useState("loading"); // Current app phase
  const [fadeIn, setFadeIn] = useState(false); // Indicates fade-in animation
  const [transitioning, setTransitioning] = useState(false); // Prevents overlapping transitions

  // Handles switching between phases with a fade effect
  const transitionTo = (newPhase) => {
    if (transitioning) return; // Avoid overlapping transitions
    setTransitioning(true);
    setFadeIn(false);
    setTimeout(() => {
      setPhase(newPhase);
      setFadeIn(true);
      setTransitioning(false);
    }, 400);
  };

  // Starts initial fade-in when component mounts
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Wraps the app with all global state providers
  return (
    <FlagsProvider>
      <InventoryProvider>
        <NotesProvider>
          <SaveSystemProvider>
            <AudioProvider>
              <GameScreen
                phase={phase}
                transitionTo={transitionTo}
                fadeIn={fadeIn}
                transitioning={transitioning}
              />
            </AudioProvider>
          </SaveSystemProvider>
        </NotesProvider>
      </InventoryProvider>
    </FlagsProvider>
  );
}