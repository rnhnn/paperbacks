// --- React & context ---
import { useState, useRef } from "react";
import { useSaveSystem } from "../context/SaveSystemContext";

// --- Components & data ---
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import SceneViewer from "./SceneViewer";
import ProtagonistHub from "./ProtagonistHub";
import sceneData from "../data/scenes/scene.json";

export default function GameScreen({ phase, transitionTo, fadeIn, transitioning }) {
  const { quickSave, quickLoad } = useSaveSystem(); // save/load actions
  const [savedScene, setSavedScene] = useState(null); // restored scene snapshot
  const [sceneKey, setSceneKey] = useState(0); // forces SceneViewer remount
  const sceneSnapshotRef = useRef(() => null); // stores latest snapshot builder

  // Update snapshot builder when SceneViewer provides a new one
  const handleSceneSnapshotUpdate = (fn) => {
    sceneSnapshotRef.current = fn;
  };

  // Manual quick load (used by Continue as well)
  const handleQuickLoad = () => {
    const sceneSlice = quickLoad();
    if (sceneSlice) {
      setSavedScene(sceneSlice);
      setSceneKey((k) => k + 1); // re-render SceneViewer
    }
  };

  // Manual quick save
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

  // Continue from local save
  const handleContinue = () => {
    handleQuickLoad(); // load saved state from localStorage
    transitionTo("game"); // move to gameplay
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
          />
        )}

        {/* Phase 3: main gameplay */}
        {phase === "game" && (
          <div className="game">
            <SceneViewer
              key={sceneKey}
              scene={sceneData}
              savedScene={savedScene}
              onSceneSnapshot={handleSceneSnapshotUpdate}
            />
            <ProtagonistHub
              onQuickSave={handleQuickSave}
              onQuickLoad={handleQuickLoad}
            />
          </div>
        )}
      </div>
    </div>
  );
}