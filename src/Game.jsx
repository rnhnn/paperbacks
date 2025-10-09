import "./styles/Variables.css";
import "./styles/Animations.css";
import "./styles/Globals.css";
import "./styles/Game.css";

import { useState, useEffect } from "react";
import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext";
import { FlagsProvider } from "./context/FlagsContext"; // Added FlagsProvider
import useGameScale from "./hooks/useGameScale";

import LoadingScreen from "./components/LoadingScreen";
import MainMenu from "./components/MainMenu";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";

import sceneData from "./data/scenes/scene.json";

export default function Game() {
  useGameScale(960, 540);

  const [phase, setPhase] = useState("loading"); // 'loading' | 'menu' | 'game'
  const [fadeIn, setFadeIn] = useState(false); // triggers fade-in of current screen
  const [transitioning, setTransitioning] = useState(false); // blocks multiple transitions

  // Initiate transition to next phase with fade-out
  const transitionTo = (newPhase) => {
    if (transitioning) return; // block if already transitioning
    setTransitioning(true);
    setFadeIn(false); // start fade-out
    setTimeout(() => {
      setPhase(newPhase); // swap phase
      setFadeIn(true); // fade-in new screen
      setTransitioning(false); // allow next transition
    }, 400); // match CSS fade-out duration
  };

  // When player clicks New Game
  const handleNewGame = () => {
    transitionTo("game");
  };

  // Initial fade-in for first screen
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 20); // tiny delay for CSS transition
    return () => clearTimeout(t);
  }, []);

  return (
    <FlagsProvider>
      {/* Global flag state available to all children */}
      <InventoryProvider>
        <NotesProvider>
          {/* Top-level game screen for centering/scaling */}
          <div className="game-screen">
            {/* Wrapper responsible for all screen-level transitions (fade, slide, etc.) */}
            <div
              className={`game-screen-transition ${fadeIn ? "fade-in" : ""} ${
                transitioning && !fadeIn ? "fade-out" : ""
              }`}
            >
              {phase === "loading" && (
                <LoadingScreen onComplete={() => transitionTo("menu")} />
              )}
              {phase === "menu" && <MainMenu onNewGame={handleNewGame} />}
              {phase === "game" && (
                <div className="game">
                  <SceneViewer scene={sceneData} />
                  <ProtagonistHub />
                </div>
              )}
            </div>
          </div>
        </NotesProvider>
      </InventoryProvider>
    </FlagsProvider>
  );
}