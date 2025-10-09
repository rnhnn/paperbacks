import "./styles/Variables.css";
import "./styles/Globals.css";
import "./styles/Game.css";

import { useState, useEffect } from "react";
import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext";
import useGameScale from "./hooks/useGameScale";

import LoadingScreen from "./components/LoadingScreen";
import MainMenu from "./components/MainMenu";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";

import sceneData from "./data/scenes/scene.json";

export default function Game() {
  useGameScale(960, 540);

  const [phase, setPhase] = useState("loading"); // 'loading' | 'menu' | 'game'
  const [nextPhase, setNextPhase] = useState(null); // holds the next phase during fade-out
  const [fadeIn, setFadeIn] = useState(false); // triggers fade-in of current screen
  const [isFadingOut, setIsFadingOut] = useState(false); // triggers fade-out before screen swap

  // Initiate transition to next phase with fade-out
  const transitionTo = (newPhase) => {
    setNextPhase(newPhase);
    setIsFadingOut(true); // start fade-out of current screen
  };

  // When player clicks New Game
  const handleNewGame = () => {
    transitionTo("game");
  };

  // Handle fade-in when phase changes or after fade-out completes
  useEffect(() => {
    if (!isFadingOut) {
      const t = setTimeout(() => setFadeIn(true), 20); // tiny delay for CSS transition
      return () => clearTimeout(t);
    }
  }, [phase, isFadingOut]);

  // Handle fade-out completion: swap to next phase
  useEffect(() => {
    if (!isFadingOut) return;
    const t = setTimeout(() => {
      if (nextPhase) {
        setPhase(nextPhase);
        setNextPhase(null);
      }
      setIsFadingOut(false); // reset fade-out
      setFadeIn(false); // reset fade-in before next screen mounts
    }, 400); // match CSS fade-out duration
    return () => clearTimeout(t);
  }, [isFadingOut, nextPhase]);

  return (
    <InventoryProvider>
      <NotesProvider>
        {/* Top-level game screen for centering/scaling */}
        <div className="game-screen">
          {/* Wrapper responsible for all screen-level transitions (fade, slide, etc.) */}
          <div
            className={`game-screen-transition ${
              fadeIn ? "fade-in" : ""
            } ${isFadingOut ? "fade-out" : ""}`}
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
  );
}
