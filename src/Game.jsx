// Global styles
import "./styles/Variables.css";
import "./styles/Globals.css";
import "./styles/Game.css";

// React and context imports
import { useState } from "react";
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

  // Switch between app phases immediately
  const transitionTo = (newPhase) => {
    setPhase(newPhase);
  };

  // Wrap app with all global state providers
  return (
    <FlagsProvider>
      <InventoryProvider>
        <NotesProvider>
          <SaveSystemProvider>
            <AudioProvider>
              <GameScreen phase={phase} transitionTo={transitionTo} />
            </AudioProvider>
          </SaveSystemProvider>
        </NotesProvider>
      </InventoryProvider>
    </FlagsProvider>
  );
}