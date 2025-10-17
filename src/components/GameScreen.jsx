// React and context hooks
import { useState, useRef, useEffect } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";
import { useAudio } from "../contexts/AudioContext";
import useFadeDuration from "../hooks/useFadeDuration";
import useText from "../hooks/useText"; // Added: translation hook for localized title text

// Core helpers
import { isDebugMode } from "../helpers/isDebugMode";

// Components
import Loading from "./Loading";
import MainMenu from "./MainMenu";
import StoryFlow from "./StoryFlow";
import PlayerMenu from "./PlayerMenu";
import ScreenTransition from "./ScreenTransition";
import TitleCard from "./TitleCard";

// Data
import storyData from "../data/story.json";
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";

// Styles
import "../styles/ScreenTransition.css";

// Define delay before main menu music starts
const MUSIC_DELAY = 350; // ms

export default function GameScreen({ phase, transitionTo }) {
  // Normalize fade duration from CSS in milliseconds
  const fadeDuration = useFadeDuration(400);

  const { quickSave, quickLoad } = useSaveSystem(); // Handles quick save/load operations
  const [savedStory, setSavedStory] = useState(null); // Holds the current or loaded story
  const [storyKey, setStoryKey] = useState(0); // Forces StoryFlow to remount when changed
  const storySnapshotRef = useRef(() => null); // Stores a snapshot builder function
  const [transitioning, setTransitioning] = useState(false); // Tracks active screen fade
  const [showPlayerMenu, setShowPlayerMenu] = useState(false); // Tracks if the PlayerMenu should be visible

  // Access translation function
  const { t } = useText();

  // Access context setters for full game reset
  const { setItems } = useInventory();
  const { setNotes } = useNotes();
  const { setFlags } = useFlags();

  // Access global audio control
  const {
    playMainMenuMusic,
    stopMusic,
    playAmbience, // Added
    stopAmbience, // Added
  } = useAudio();

  // Track which ambience is currently playing to avoid restarts
  const currentAmbienceRef = useRef(null);

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

  // Stop ambience when leaving gameplay
  useEffect(() => {
    if (phase !== "game") {
      stopAmbience();
      currentAmbienceRef.current = null;
    }
  }, [phase, stopAmbience]);

  // Ensure PlayerMenu is shown when resuming from a saved game after reload
  useEffect(() => {
    if (phase === "game" && savedStory && !showPlayerMenu) {
      setShowPlayerMenu(true);
    }
  }, [phase, savedStory, showPlayerMenu]);

  // Game setup helpers

  // Store StoryFlow snapshot builder reference
  const handleStorySnapshotUpdate = (fn) => {
    storySnapshotRef.current = fn;
  };

  // Handle ambience updates emitted from StoryFlow
  const handleAmbienceChange = (ambienceKey) => {
    if (!ambienceKey || ambienceKey === currentAmbienceRef.current) return;
    currentAmbienceRef.current = ambienceKey;
    playAmbience(ambienceKey);
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
    setShowPlayerMenu(false);
    console.log("Game state reset to JSON defaults (localStorage preserved)");
  };

  // Transition logic

  // Trigger fade-out → phase switch → fade-in
  const triggerTransition = async (targetPhase) => {
    if (transitioning) return; // Prevent overlap
    setTransitioning(true);

    // Wait for fade-out to complete
    await new Promise((resolve) => setTimeout(resolve, fadeDuration));

    // Wait for music fade-out before switching phase
    if (phase === "menu") await stopMusic();

    // Switch to the new phase (fade-in starts immediately)
    transitionTo(targetPhase);

    // Wait for fade-in to complete
    await new Promise((resolve) => setTimeout(resolve, fadeDuration));

    setTransitioning(false); // Allow new transitions
  };

  // Render phases
  return (
    <div className="game-screen">
      {/* Phase 1: Loading assets */}
      {phase === "loading" && (
        <Loading
          onComplete={(mode) => {
            // Skip full flow when launched in debug mode (local or ?debug=1)
            if (mode === "skip" && isDebugMode()) {
              resetGameState(); // Initialize default data instantly
              transitionTo("game"); // Jump directly to gameplay (no fade)
            } else {
              triggerTransition("menu"); // Normal fade transition to main menu
            }
          }}
        />
      )}

      {/* Phase 2: Main menu */}
      {phase === "menu" && (
        <MainMenu
          onNewGame={() => {
            resetGameState();
            triggerTransition("titleCard"); // Show title card before gameplay
          }}
          onContinue={handleContinue}
          onLoadFromFile={handleLoadFromFile}
        />
      )}

      {/* Phase 3: Title card intro */}
      {phase === "titleCard" && (
        <TitleCard
          startDelay={fadeDuration} // Time delay before fade-in
          fadeInDuration={1500} // Fade-in duration
          holdDuration={2500} // Text remains visible
          fadeOutDuration={1500} // Fade-out
          text={t("ui.titleCard.burescaMorning")}
          onComplete={() => triggerTransition("game")}
        />
      )}

      {/* Phase 4: Main gameplay */}
      {phase === "game" && (
        <div className="game">
          <StoryFlow
            key={storyKey}
            story={storyData}
            savedStory={savedStory}
            onStorySnapshot={handleStorySnapshotUpdate}
            onBegin={() => setShowPlayerMenu(true)} // Added callback for Begin
            onAmbienceChange={handleAmbienceChange} // Added: handle ambience changes
          />

          {showPlayerMenu && ( // Only render PlayerMenu when Begin was clicked or resumed from save
            <PlayerMenu
              onQuickSave={handleQuickSave}
              onQuickLoad={handleQuickLoad}
              getStorySnapshot={() => storySnapshotRef.current?.()}
              onExitToMenu={() => triggerTransition("menu")}
            />
          )}
        </div>
      )}

      {/* Transition overlay rendered above everything */}
      <ScreenTransition active={transitioning} />
    </div>
  );
}