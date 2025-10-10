import "./styles/Variables.css";
import "./styles/Animations.css";
import "./styles/Globals.css";
import "./styles/Game.css";

import { useState, useEffect } from "react";
import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext";
import { FlagsProvider } from "./context/FlagsContext";
import useGameScale from "./hooks/useGameScale";

import LoadingScreen from "./components/LoadingScreen";
import MainMenu from "./components/MainMenu";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";

import sceneData from "./data/scenes/scene.json";

export default function Game() {
  useGameScale(960, 540);

  const [phase, setPhase] = useState("loading"); // 'loading' | 'menu' | 'game'
  const [fadeIn, setFadeIn] = useState(false); // triggers fade-in
  const [transitioning, setTransitioning] = useState(false); // blocks multiple transitions

  // Transition to next phase with fade
  const transitionTo = (newPhase) => {
    if (transitioning) return;
    setTransitioning(true);
    setFadeIn(false);
    setTimeout(() => {
      setPhase(newPhase);
      setFadeIn(true);
      setTransitioning(false);
    }, 400); // match CSS transition timing
  };

  const handleNewGame = () => transitionTo("game");

  // Initial fade-in
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <FlagsProvider>
      <InventoryProvider>
        <NotesProvider>
          <div className="game-screen">
            <div
              className={`game-screen-transition ${fadeIn ? "fade-in" : ""} ${
                transitioning && !fadeIn ? "fade-out" : ""
              }`}
            >
              {phase === "loading" && (
                <LoadingScreen onComplete={() => transitionTo("menu")} />
              )}
              {phase === "menu" && <MainMenu onNewGame={handleNewGame} />}
              {phase === "game" && <GameContent />}
            </div>
          </div>
        </NotesProvider>
      </InventoryProvider>
    </FlagsProvider>
  );
}

// --- Core in-game view ---
function GameContent() {
  // Track SceneViewer's internal state for save system (non-debug)
  const [sceneState, setSceneState] = useState({
    currentNodeId: null,
    renderedBlocks: [],
  });

  // SceneViewer reports updates here (used later for saving/loading)
  const handleSceneUpdate = (update) => setSceneState(update);

  return (
    <div className="game">
      <SceneViewer scene={sceneData} onSceneUpdate={handleSceneUpdate} />
      <ProtagonistHub />
    </div>
  );
}