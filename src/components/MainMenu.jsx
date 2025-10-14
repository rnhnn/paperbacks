// Main menu displayed after the loading screen
import { useState, useEffect, useRef, useCallback } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import { useAudio } from "../contexts/AudioContext";
import useText from "../hooks/useText";
import WindowOverlay from "./WindowOverlay";
import Credits from "./Credits";
import "../styles/MainMenu.css";

export default function MainMenu({ onNewGame, onContinue, onLoadFromFile }) {
  // Track quick-save availability and credits visibility
  const [hasSave, setHasSave] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  // Track audio mute and fullscreen states
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileInputRef = useRef(null);

  const { storageKey } = useSaveSystem(); // Identify save slot key
  const { t } = useText(); // Access translation function
  const { stopMusic, fadeOutMusic, fadeInMusic } = useAudio(); // Control background music

  // Check for an existing quick save once on mount
  useEffect(() => {
    try {
      setHasSave(Boolean(localStorage.getItem(storageKey)));
    } catch (err) {
      console.warn("Could not access localStorage:", err);
    }
  }, [storageKey]);

  // Open hidden file input to choose an external save
  const handleLoadGameClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Read external save file and validate its structure
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data || typeof data !== "object" || !data.version) {
          console.warn("Invalid save file structure");
          return;
        }

        console.log("Loaded save from file:", data);
        stopMusic(); // Stop music before loading a save
        onLoadFromFile(data);
      } catch (err) {
        console.error("Failed to read save file:", err);
      } finally {
        e.target.value = ""; // Allow selecting the same file again
      }
    },
    [onLoadFromFile, stopMusic]
  );

  // Toggle mute state and control background music
  const muteLock = useRef(false); // Prevent rapid spamming during fade

  const handleMuteClick = useCallback(async () => {
    if (muteLock.current) return; // Ignore repeated clicks during transition
    muteLock.current = true;

    if (isMuted) {
      await fadeInMusic?.(); // Resume music if previously faded
    } else {
      await fadeOutMusic?.(); // Fade out music smoothly and pause
    }

    setIsMuted(!isMuted);

    // Unlock after fade completes
    setTimeout(() => {
      muteLock.current = false;
    }, 450);
  }, [isMuted, fadeOutMusic, fadeInMusic]);

  // Toggle fullscreen mode for the browser
  const handleFullscreenClick = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  // Render the main menu UI
  return (
    <div className="main-menu">
      <h1 className="main-menu-title">{t("ui.mainMenu.title")}</h1>

      <div className="main-menu-options">
        {hasSave && (
          <button
            type="button"
            className="main-menu-button"
            onClick={() => {
              stopMusic(); // Stop menu music before resuming gameplay
              onContinue();
            }}
          >
            {t("ui.mainMenu.continue")}
          </button>
        )}

        <button
          type="button"
          className="main-menu-button"
          onClick={() => {
            stopMusic(); // Stop menu music before starting a new game
            onNewGame();
          }}
        >
          {t("ui.mainMenu.newGame")}
        </button>

        <button
          type="button"
          className="main-menu-button"
          onClick={handleLoadGameClick}
        >
          {t("ui.mainMenu.loadGame")}
        </button>

        <button
          type="button"
          className="main-menu-button"
          onClick={() => setShowCredits(true)}
        >
          {t("ui.mainMenu.credits")}
        </button>

        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Control buttons placed in bottom-right corner */}
      <div className="main-menu-controls">
        <button type="button" className="main-menu-controls-button" onClick={handleMuteClick}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          className="main-menu-controls-button"
          onClick={handleFullscreenClick}
        >
          {isFullscreen ? "Windowed" : "Fullscreen"}
        </button>
      </div>

      {showCredits && (
        <WindowOverlay onClose={() => setShowCredits(false)}>
          <Credits onClose={() => setShowCredits(false)} />
        </WindowOverlay>
      )}
    </div>
  );
}