// --- React & contexts ---
import { useState, useRef } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";

// --- Components & data ---
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import StoryFlow from "./StoryFlow";
import PlayerMenu from "./PlayerMenu";
import sceneData from "../data/scenes/scene.json";

export default function GameScreen({ phase, transitionTo, fadeIn, transitioning }) {
  const { quickSave, quickLoad } = useSaveSystem(); // save/load handlers
  const [savedScene, setSavedScene] = useState(null); // current or loaded scene data
  const [sceneKey, setSceneKey] = useState(0); // forces StoryFlow remount
  const sceneSnapshotRef = useRef(() => null); // holds current snapshot builder

  // Register snapshot builder from StoryFlow
  const handleSceneSnapshotUpdate = (fn) => {
    sceneSnapshotRef.current = fn;
  };

  // Load scene from localStorage (used by Continue and Quick Load)
  const handleQuickLoad = () => {
    const sceneSlice = quickLoad();
    if (sceneSlice) {
      setSavedScene(sceneSlice);
      setSceneKey((k) => k + 1); // re-render StoryFlow
    }
  };

  // Save current scene snapshot to localStorage
  const handleQuickSave = () => {
    try {
      const snapshot = sceneSnapshotRef.current?.();
      if (snapshot) {
        console.log("📸 Snapshot built:", snapshot);
        quickSave(snapshot);
      } else {
        console.warn("⚠️ No scene snapshot available to save.");
      }
    } catch (err) {
      console.error("❌ Quick Save failed:", err);
    }
  };

  // Continue from localStorage save
  const handleContinue = () => {
    handleQuickLoad();
    transitionTo("game");
  };

  // Load save file imported from disk
  const handleLoadFromFile = (data) => {
    console.log("📂 Importing save from file:", data);
    if (data.scene) {
      setSavedScene(data.scene);
      setSceneKey((k) => k + 1);
    }
    transitionTo("game");
  };

  return (
    <div className="game-screen">
      <div
        className={`game-screen-transition ${fadeIn ? "fade-in" : ""} ${
          transitioning && !fadeIn ? "fade-out" : ""
        }`}
      >
        {/* Phase 1: loading assets */}
        {phase === "loading" && (
          <Loading onComplete={() => transitionTo("menu")} />
        )}

        {/* Phase 2: main menu */}
        {phase === "menu" && (
          <MainMenu
            onNewGame={() => transitionTo("game")}
            onContinue={handleContinue}
            onLoadFromFile={handleLoadFromFile}
          />
        )}

        {/* Phase 3: main gameplay */}
        {phase === "game" && (
          <div className="game">
            <StoryFlow
              key={sceneKey}
              scene={sceneData}
              savedScene={savedScene}
              onSceneSnapshot={handleSceneSnapshotUpdate}
            />
            <PlayerMenu
              onQuickSave={handleQuickSave}
              onQuickLoad={handleQuickLoad}
              getSceneSnapshot={() => sceneSnapshotRef.current?.()}
              onExitToMenu={() => transitionTo("menu")}
            />
          </div>
        )}
      </div>
    </div>
  );
}