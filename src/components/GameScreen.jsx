// --- React & contexts ---
import { useState, useRef } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";

// --- Components & data ---
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import StoryFlow from "./StoryFlow";
import PlayerMenu from "./PlayerMenu";
import storyData from "../data/story.json";

export default function GameScreen({ phase, transitionTo, fadeIn, transitioning }) {
  const { quickSave, quickLoad } = useSaveSystem(); // save/load handlers
  const [savedStory, setSavedStory] = useState(null); // current or loaded story data
  const [storyKey, setStoryKey] = useState(0); // forces StoryFlow remount
  const storySnapshotRef = useRef(() => null); // holds current snapshot builder

  // --- Access context setters for reset ---
  const { setItems } = useInventory();
  const { setNotes } = useNotes();
  const { setFlags } = useFlags();

  // --- Register snapshot builder from StoryFlow ---
  const handleStorySnapshotUpdate = (fn) => {
    storySnapshotRef.current = fn;
  };

  // --- Load story from localStorage (used by Continue and Quick Load) ---
  const handleQuickLoad = () => {
    const storySlice = quickLoad();
    if (storySlice) {
      setSavedStory(storySlice);
      setStoryKey((k) => k + 1); // re-render StoryFlow
    }
  };

  // --- Save current story snapshot to localStorage ---
  const handleQuickSave = () => {
    try {
      const snapshot = storySnapshotRef.current?.();
      if (snapshot) {
        console.log("📸 Snapshot built:", snapshot);
        quickSave(snapshot);
      } else {
        console.warn("⚠️ No story snapshot available to save.");
      }
    } catch (err) {
      console.error("❌ Quick Save failed:", err);
    }
  };

  // --- Continue from localStorage save ---
  const handleContinue = () => {
    handleQuickLoad();
    transitionTo("game");
  };

  // --- Load save file imported from disk ---
  const handleLoadFromFile = (data) => {
    console.log("📂 Importing save from file:", data);
    if (data.story) {
      setSavedStory(data.story);
      setStoryKey((k) => k + 1);
    }
    transitionTo("game");
  };

  // --- Reset all in-memory contexts for New Game ---
  const resetGameState = () => {
    // Clear acquired inventory state
    setItems((prev) => prev.map((it) => ({ ...it, acquired: false })));

    // Lock all notes again
    setNotes((prev) => prev.map((n) => ({ ...n, unlocked: false })));

    // Reset flags to an empty object (default)
    setFlags({});

    // Forget the previous story state
    setSavedStory(null);

    // Force StoryFlow remount
    setStoryKey((k) => k + 1);

    // Keep localStorage untouched so Continue still works
    console.log("🧹 Game state reset for New Game (localStorage preserved)");
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
            onNewGame={() => {
              resetGameState(); // ensures a clean start
              transitionTo("game");
            }}
            onContinue={handleContinue}
            onLoadFromFile={handleLoadFromFile}
          />
        )}

        {/* Phase 3: main gameplay */}
        {phase === "game" && (
          <div className="game">
            <StoryFlow
              key={storyKey}
              story={storyData}
              savedStory={savedStory}
              onStorySnapshot={handleStorySnapshotUpdate}
            />
            <PlayerMenu
              onQuickSave={handleQuickSave}
              onQuickLoad={handleQuickLoad}
              getStorySnapshot={() => storySnapshotRef.current?.()}
              onExitToMenu={() => transitionTo("menu")}
            />
          </div>
        )}
      </div>
    </div>
  );
}