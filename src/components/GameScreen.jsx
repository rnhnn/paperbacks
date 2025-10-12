// --- React & contexts ---
import { useState, useRef } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";

// --- Components & data ---
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import StoryFlow from "./StoryFlow";
import PlayerMenu from "./PlayerMenu";
import storyData from "../data/stories/story.json";

export default function GameScreen({ phase, transitionTo, fadeIn, transitioning }) {
  const { quickSave, quickLoad } = useSaveSystem(); // save/load handlers
  const [savedStory, setSavedStory] = useState(null); // current or loaded story data
  const [storyKey, setStoryKey] = useState(0); // forces StoryFlow remount
  const storySnapshotRef = useRef(() => null); // holds current snapshot builder

  // Register snapshot builder from StoryFlow
  const handleStorySnapshotUpdate = (fn) => {
    storySnapshotRef.current = fn;
  };

  // Load story from localStorage (used by Continue and Quick Load)
  const handleQuickLoad = () => {
    const storySlice = quickLoad();
    if (storySlice) {
      setSavedStory(storySlice);
      setStoryKey((k) => k + 1); // re-render StoryFlow
    }
  };

  // Save current story snapshot to localStorage
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

  // Continue from localStorage save
  const handleContinue = () => {
    handleQuickLoad();
    transitionTo("game");
  };

  // Load save file imported from disk
  const handleLoadFromFile = (data) => {
    console.log("📂 Importing save from file:", data);
    if (data.story) {
      setSavedStory(data.story);
      setStoryKey((k) => k + 1);
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