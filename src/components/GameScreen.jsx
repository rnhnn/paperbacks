// React and context hooks
import { useState, useRef } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";

// Components and data
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import StoryFlow from "./StoryFlow";
import PlayerMenu from "./PlayerMenu";
import storyData from "../data/story.json";

export default function GameScreen({ phase, transitionTo, fadeIn, transitioning }) {
  const { quickSave, quickLoad } = useSaveSystem(); // Handles quick save/load operations
  const [savedStory, setSavedStory] = useState(null); // Holds the current or loaded story
  const [storyKey, setStoryKey] = useState(0); // Forces StoryFlow to remount when changed
  const storySnapshotRef = useRef(() => null); // Stores a snapshot builder function

  // Access context setters for full game reset
  const { setItems } = useInventory();
  const { setNotes } = useNotes();
  const { setFlags } = useFlags();

  // Registers the snapshot builder provided by StoryFlow
  const handleStorySnapshotUpdate = (fn) => {
    storySnapshotRef.current = fn;
  };

  // Loads a story from localStorage (used by Continue or Quick Load)
  const handleQuickLoad = () => {
    const storySlice = quickLoad();
    if (storySlice) {
      setSavedStory(storySlice);
      setStoryKey((k) => k + 1); // Triggers StoryFlow re-render
    }
  };

  // Saves the current story snapshot to localStorage
  const handleQuickSave = () => {
    try {
      const snapshot = storySnapshotRef.current?.();
      if (snapshot) {
        console.log("Snapshot built:", snapshot);
        quickSave(snapshot);
      } else {
        console.warn("No story snapshot available to save.");
      }
    } catch (err) {
      console.error("Quick Save failed:", err);
    }
  };

  // Continues a game from the localStorage save
  const handleContinue = () => {
    handleQuickLoad();
    transitionTo("game");
  };

  // Loads a save imported from an external file
  const handleLoadFromFile = (data) => {
    console.log("Importing save from file:", data);
    if (data.story) {
      setSavedStory(data.story);
      setStoryKey((k) => k + 1);
    }
    transitionTo("game");
  };

  // Resets in-memory states for a new game
  const resetGameState = () => {
    setItems((prev) => prev.map((it) => ({ ...it, acquired: false }))); // Clears inventory
    setNotes((prev) => prev.map((n) => ({ ...n, unlocked: false }))); // Locks notes
    setFlags({}); // Clears all flags
    setSavedStory(null); // Removes story progress
    setStoryKey((k) => k + 1); // Forces StoryFlow remount
    console.log("Game state reset for New Game (localStorage preserved)");
  };

  return (
    <div className="game-screen">
      <div
        className={`game-screen-transition ${fadeIn ? "fade-in" : ""} ${
          transitioning && !fadeIn ? "fade-out" : ""
        }`}
      >
        {/* Phase 1: Loading assets */}
        {phase === "loading" && (
          <Loading onComplete={() => transitionTo("menu")} />
        )}

        {/* Phase 2: Main menu */}
        {phase === "menu" && (
          <MainMenu
            onNewGame={() => {
              resetGameState(); // Ensures a clean start
              transitionTo("game");
            }}
            onContinue={handleContinue}
            onLoadFromFile={handleLoadFromFile}
          />
        )}

        {/* Phase 3: Main gameplay */}
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