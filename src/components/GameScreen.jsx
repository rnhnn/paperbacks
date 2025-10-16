// React and context hooks
import { useState, useRef, useEffect } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";
import { useAudio } from "../contexts/AudioContext"; // Access global audio control

// Components and data
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import StoryFlow from "./StoryFlow";
import PlayerMenu from "./PlayerMenu";
import "../styles/ScreenTransition.css";
import ScreenTransition from "./ScreenTransition";
import storyData from "../data/story.json";
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";

// Read CSS variable and convert to milliseconds
const rootStyles = getComputedStyle(document.documentElement);
const rawValue = rootStyles.getPropertyValue("--fade-screen-duration").trim();
const FADE_DURATION = rawValue.endsWith("ms")
  ? parseFloat(rawValue)
  : parseFloat(rawValue) * 1000;

// Define delay before main menu music starts
const MUSIC_DELAY = 350; // ms

export default function GameScreen({ phase, transitionTo }) {
  const { quickSave, quickLoad } = useSaveSystem(); // Handles quick save/load operations
  const [savedStory, setSavedStory] = useState(null); // Holds the current or loaded story
  const [storyKey, setStoryKey] = useState(0); // Forces StoryFlow to remount when changed
  const storySnapshotRef = useRef(() => null); // Stores a snapshot builder function
  const [transitioning, setTransitioning] = useState(false); // Tracks active screen fade

  // Access context setters for full game reset
  const { setItems } = useInventory();
  const { setNotes } = useNotes();
  const { setFlags } = useFlags();

  // Access global audio control
  const { playMainMenuMusic, stopMusic } = useAudio();

  // Play or stop main menu music based on current phase
  useEffect(() => {
    let timeoutId;

    if (phase === "menu") {
      // Delay main menu music start
      timeoutId = setTimeout(() => {
        playMainMenuMusic();
      }, MUSIC_DELAY);
    } else {
      stopMusic();
    }

    // Clear pending timeout when leaving menu early
    return () => clearTimeout(timeoutId);
  // Intentionally depend only on phase to avoid restarting music on mute toggles
  }, [phase]); 

  // Game setup helpers

  // Store StoryFlow snapshot builder reference
  const handleStorySnapshotUpdate = (fn) => {
    storySnapshotRef.current = fn;
  };

  // Load story from quick save
  const handleQuickLoad = () => {
    const storySlice = quickLoad();
    if (storySlice) {
      setSavedStory(storySlice);
      setStoryKey((k) => k + 1);
    }
  };

  // Save current story snapshot
  const handleQuickSave = () => {
    try {
      const snapshot = storySnapshotRef.current?.();
      if (snapshot) quickSave(snapshot);
    } catch (err) {
      console.error("Quick Save failed:", err);
    }
  };

  // Continue game from quick save
  const handleContinue = () => {
    handleQuickLoad();
    triggerTransition("game");
  };

  // Load external save file
  const handleLoadFromFile = (data) => {
    if (data.story) {
      setSavedStory(data.story);
      setStoryKey((k) => k + 1);
    }
    triggerTransition("game");
  };

  // Reset game state to JSON defaults
  const resetGameState = () => {
    setItems(itemsData.map((it) => ({ ...it, acquired: !!it.acquired })));
    setNotes(notesData.map((n) => ({ ...n, unlocked: !!n.unlocked })));
    setFlags({});
    setSavedStory(null);
    setStoryKey((k) => k + 1);
    console.log("Game state reset to JSON defaults (localStorage preserved)");
  };

  // Transition logic

  // Trigger fade-out → phase switch → fade-in
  const triggerTransition = async (targetPhase) => {
    if (transitioning) return; // Prevent overlap
    setTransitioning(true);

    // Wait for fade-out to complete
    await new Promise((resolve) => setTimeout(resolve, FADE_DURATION));

    // Wait for music fade-out before switching phase
    if (phase === "menu") await stopMusic();

    // Switch to the new phase (fade-in starts immediately)
    transitionTo(targetPhase);

    // Wait for fade-in to complete
    await new Promise((resolve) => setTimeout(resolve, FADE_DURATION));

    setTransitioning(false); // Allow new transitions
  };

  // Render phases
  return (
    <div className="game-screen">
      {/* Phase 1: Loading assets */}
      {phase === "loading" && (
        <Loading onComplete={() => triggerTransition("menu")} />
      )}

      {/* Phase 2: Main menu */}
      {phase === "menu" && (
        <MainMenu
          onNewGame={() => {
            resetGameState();
            triggerTransition("game");
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
            onExitToMenu={() => triggerTransition("menu")}
          />
        </div>
      )}

      {/* Transition overlay rendered above everything */}
      <ScreenTransition active={transitioning} />
    </div>
  );
}