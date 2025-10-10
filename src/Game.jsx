import "./styles/Variables.css";
import "./styles/Animations.css";
import "./styles/Globals.css";
import "./styles/Game.css";

import { useState, useEffect } from "react";
import { InventoryProvider, useInventory } from "./context/InventoryContext";
import { NotesProvider, useNotes } from "./context/NotesContext";
import { FlagsProvider, useFlags } from "./context/FlagsContext";
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

// --- Core in-game view (with Quick Save prototype) ---
function GameContent() {
  const { inventory } = useInventory();
  const { notes } = useNotes();
  const { flags } = useFlags();

  // Track SceneViewer's internal state for save system
  const [sceneState, setSceneState] = useState({
    currentNodeId: null,
    renderedBlocks: [],
  });

  // SceneViewer reports updates here (used later for saving/loading)
  const handleSceneUpdate = (update) => setSceneState(update);

  // --- Save system prototype ---
  const [saveMsg, setSaveMsg] = useState("");

  // Build snapshot object from current world state
  const buildSaveSnapshot = () => {
    return {
      meta: { createdAt: new Date().toISOString() },
      currentNodeId: sceneState.currentNodeId,
      recentNodes: (sceneState.renderedBlocks || []).map((b) => b.id || b.type),
      flags: { ...flags },
      inventory: [...inventory], // item IDs
      notes: (notes || []).filter((n) => n.unlocked).map((n) => n.id),
    };
  };

  // Save snapshot to localStorage
  const handleQuickSave = () => {
    try {
      const snapshot = buildSaveSnapshot();
      localStorage.setItem("paperbacks_quick_save", JSON.stringify(snapshot));
      setSaveMsg("Saved ✓");
      console.log("Saved snapshot:", snapshot);
      setTimeout(() => setSaveMsg(""), 1500);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveMsg("Save failed");
      setTimeout(() => setSaveMsg(""), 1500);
    }
  };

  return (
    <div className="game">
      <SceneViewer scene={sceneData} onSceneUpdate={handleSceneUpdate} />
      <ProtagonistHub />

      {/* Quick Save button (non-intrusive) */}
      <div style={{ position: "fixed", left: 10, top: 10, zIndex: 9999 }}>
        <button
          onClick={handleQuickSave}
          style={{
            padding: "6px 10px",
            fontSize: "12px",
            borderRadius: 6,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
          }}
        >
          Quick Save
        </button>
        <div style={{ color: "white", fontSize: "12px", marginTop: 6 }}>
          {saveMsg}
        </div>
      </div>
    </div>
  );
}