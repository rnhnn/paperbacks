// React and context hooks
import { useState, useRef, useEffect } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";
import { useAudio } from "../contexts/AudioContext";

// Components and data
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import StoryFlow from "./StoryFlow";
import PlayerMenu from "./PlayerMenu";
import ScreenTransition from "./ScreenTransition"; // Visual fade layer
import "../styles/ScreenTransition.css"; // Transition styles
import { wait } from "../helpers/transitionHelpers"; // Async helper for sequencing fades
import storyData from "../data/story.json";
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";

// Local constant to match CSS fade timing
const FADE_DURATION = 400;

export default function GameScreen({ phase, transitionTo }) {
  const { playMusic } = useAudio(); // Control background music
  const { quickSave, quickLoad } = useSaveSystem(); // Handles quick save/load operations
  const [savedStory, setSavedStory] = useState(null); // Holds the current or loaded story
  const [storyKey, setStoryKey] = useState(0); // Forces StoryFlow to remount when changed
  const storySnapshotRef = useRef(() => null); // Stores a snapshot builder function
  const [transitioning, setTransitioning] = useState(false); // Tracks active screen fade
  const [nextPhase, setNextPhase] = useState(null); // Temporarily holds the upcoming phase

  // Access context setters for full game reset
  const { setItems } = useInventory();
  const { setNotes } = useNotes();
  const { setFlags } = useFlags();

  // --- Game setup helpers -----------------------------------------------------

  const handleStorySnapshotUpdate = (fn) => {
    storySnapshotRef.current = fn;
  };

  const handleQuickLoad = () => {
    const storySlice = quickLoad();
    if (storySlice) {
      setSavedStory(storySlice);
      setStoryKey((k) => k + 1);
    }
  };

  const handleQuickSave = () => {
    try {
      const snapshot = storySnapshotRef.current?.();
      if (snapshot) quickSave(snapshot);
    } catch (err) {
      console.error("Quick Save failed:", err);
    }
  };

  const handleContinue = () => {
    handleQuickLoad();
    triggerTransition("game");
  };

  const handleLoadFromFile = (data) => {
    if (data.story) {
      setSavedStory(data.story);
      setStoryKey((k) => k + 1);
    }
    triggerTransition("game");
  };

  const resetGameState = () => {
    setItems(itemsData.map((it) => ({ ...it, acquired: !!it.acquired })));
    setNotes(notesData.map((n) => ({ ...n, unlocked: !!n.unlocked })));
    setFlags({});
    setSavedStory(null);
    setStoryKey((k) => k + 1);
    console.log("Game state reset to JSON defaults (localStorage preserved)");
  };

  // --- Transition logic ------------------------------------------------------

  // Trigger fade-out → optional hold → phase switch → fade-in
  const triggerTransition = async (targetPhase) => {
    if (transitioning) return; // Prevent overlap
    setTransitioning(true);
    setNextPhase(targetPhase);

    await wait(FADE_DURATION); // Fade out
    await wait(300); // Optional black hold
    transitionTo(targetPhase); // Switch screen
    await wait(FADE_DURATION); // Fade in
    setTransitioning(false);
  };

  // --- Delayed music start just for main menu --------------------------------
  useEffect(() => {
    if (phase === "menu") {
      // Run AFTER the menu is visible; delay can be adjusted freely
      const timer = setTimeout(() => {
        playMusic("mainMenu");
      }, 350); // <-- Control this delay directly
      return () => clearTimeout(timer);
    }
  }, [phase, playMusic]);

  // --- Render phases ---------------------------------------------------------
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