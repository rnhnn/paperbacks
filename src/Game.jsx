import "./styles/Variables.css";
import "./styles/Animations.css";
import "./styles/Globals.css";
import "./styles/Game.css";

import { useState, useEffect, useRef } from "react";
import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext";
import { FlagsProvider } from "./context/FlagsContext";
import { SaveSystemProvider, useSaveSystem } from "./context/SaveSystemContext";

import useGameScale from "./hooks/useGameScale";
import LoadingScreen from "./components/LoadingScreen";
import MainMenu from "./components/MainMenu";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";
import sceneData from "./data/scenes/scene.json";

function GameContent({ phase, transitionTo, fadeIn, transitioning }) {
  const { quickSave, quickLoad } = useSaveSystem();

  const [savedScene, setSavedScene] = useState(null);
  const [sceneKey, setSceneKey] = useState(0);

  // ✅ useRef instead of useState for a stable snapshot reference
  const sceneSnapshotRef = useRef(() => null);

  // SceneViewer will update this ref whenever its snapshot function changes
  const handleSceneSnapshotUpdate = (fn) => {
    sceneSnapshotRef.current = fn;
  };

  // --- Manual Quick Load ---
  const handleQuickLoad = () => {
    const sceneSlice = quickLoad();
    if (sceneSlice) {
      setSavedScene(sceneSlice);
      setSceneKey((k) => k + 1); // force remount SceneViewer
    }
  };

  // --- Manual Quick Save ---
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

  return (
    <div className="game-screen">
      <div
        className={`game-screen-transition ${fadeIn ? "fade-in" : ""} ${
          transitioning && !fadeIn ? "fade-out" : ""
        }`}
      >
        {phase === "loading" && (
          <LoadingScreen onComplete={() => transitionTo("menu")} />
        )}

        {phase === "menu" && <MainMenu onNewGame={() => transitionTo("game")} />}

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

export default function Game() {
  useGameScale(960, 540);

  const [phase, setPhase] = useState("loading");
  const [fadeIn, setFadeIn] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const transitionTo = (newPhase) => {
    if (transitioning) return;
    setTransitioning(true);
    setFadeIn(false);
    setTimeout(() => {
      setPhase(newPhase);
      setFadeIn(true);
      setTransitioning(false);
    }, 400);
  };

  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <FlagsProvider>
      <InventoryProvider>
        <NotesProvider>
          <SaveSystemProvider>
            <GameContent
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
