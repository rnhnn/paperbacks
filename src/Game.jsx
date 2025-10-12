// --- Global styles ---
import "./styles/Variables.css";
import "./styles/Animations.css";
import "./styles/Globals.css";
import "./styles/Game.css";

// --- React & contexts imports ---
import { useState, useEffect } from "react";
import { InventoryProvider } from "./contexts/InventoryContext";
import { NotesProvider } from "./contexts/NotesContext";
import { FlagsProvider } from "./contexts/FlagsContext";
import { SaveSystemProvider } from "./contexts/SaveSystemContext";

// --- Hooks & components ---
import useGameScale from "./hooks/useGameScale";
import GameScreen from "./components/GameScreen";

export default function Game() {
  useGameScale(960, 540); // keep base 960×540 resolution

  const [phase, setPhase] = useState("loading"); // current app phase
  const [fadeIn, setFadeIn] = useState(false); // fade-in flag
  const [transitioning, setTransitioning] = useState(false); // fade-out flag

  // Switch between phases with fade transition
  const transitionTo = (newPhase) => {
    if (transitioning) return; // avoid overlapping transitions
    setTransitioning(true);
    setFadeIn(false);
    setTimeout(() => {
      setPhase(newPhase);
      setFadeIn(true);
      setTransitioning(false);
    }, 400);
  };

  // Trigger initial fade-in once after mount
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Wrap everything with global state providers
  return (
    <FlagsProvider>
      <InventoryProvider>
        <NotesProvider>
          <SaveSystemProvider>
            <GameScreen
              phase={phase}
              transitionTo={transitionTo}
              fadeIn={fadeIn}
              transitioning={transitioning}
            />
          </SaveSystemProvider>
        </NotesProvider>
      </InventoryProvider>
    </FlagsProvider>
  );
}