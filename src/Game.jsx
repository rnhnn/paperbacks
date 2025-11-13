// Root game component that sets up global providers, scaling, and top-level phase control

// Styles
import "./styles/Variables.css";
import "./styles/Globals.css";
import "./styles/Game.css";

// React
import { useState } from "react";

// Contexts
import { InventoryProvider } from "./contexts/InventoryContext";
import { NotesProvider } from "./contexts/NotesContext";
import { FlagsProvider } from "./contexts/FlagsContext";
import { SaveSystemProvider } from "./contexts/SaveSystemContext";
import { AudioProvider } from "./contexts/AudioContext";

// Hooks
import useGameScale from "./hooks/useGameScale";

// Components
import GameScreen from "./components/GameScreen";

export default function Game() {
  // Maintain fixed 960×540 base resolution and apply scale based on window size
  useGameScale(960, 540);

  // Track current app phase (loading, menu, game, etc.)
  const [phase, setPhase] = useState("loading");

  // Update app phase immediately
  const transitionTo = (newPhase) => {
    setPhase(newPhase);
  };

  // Wrap the entire game inside all global providers
  return (
    <AudioProvider>
      <FlagsProvider>
        <InventoryProvider>
          <NotesProvider>
            <SaveSystemProvider>
              <GameScreen phase={phase} transitionTo={transitionTo} />
            </SaveSystemProvider>
          </NotesProvider>
        </InventoryProvider>
      </FlagsProvider>
    </AudioProvider>
  );
}