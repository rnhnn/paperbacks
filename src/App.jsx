import "./styles/Variables.css";
import "./styles/Globals.css";

import { useState, useEffect } from "react";
import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext";
import useGameScale from "./hooks/useGameScale";

import LoadingScreen from "./components/LoadingScreen";
import MainMenu from "./components/MainMenu";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";

import sceneData from "./data/scenes/scene.json";

export default function App() {
  useGameScale(960, 540);

  const [phase, setPhase] = useState("loading"); // 'loading' | 'menu' | 'game'
  const [fadeInGame, setFadeInGame] = useState(false); // triggers fade-in of game-container

  // When player clicks New Game
  const handleNewGame = () => {
    setPhase("game");
    setFadeInGame(false); // reset fade state
  };

  // Trigger fade-in after game-container mounts
  useEffect(() => {
    if (phase === "game") {
      const t = setTimeout(() => setFadeInGame(true), 20); // tiny delay to allow CSS transition
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <InventoryProvider>
      <NotesProvider>
        {phase === "loading" && <LoadingScreen onComplete={() => setPhase("menu")} />}
        {phase === "menu" && <MainMenu onNewGame={handleNewGame} />}
        {phase === "game" && (
          <div className={`game-container ${fadeInGame ? "fade-in" : ""}`}>
            <div className="game">
              <SceneViewer scene={sceneData} />
              <ProtagonistHub />
            </div>
          </div>
        )}
      </NotesProvider>
    </InventoryProvider>
  );
}
