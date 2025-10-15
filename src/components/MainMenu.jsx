// Main menu displayed after the loading screen
import { useState, useEffect, useRef, useCallback } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import useText from "../hooks/useText";
import WindowOverlay from "./WindowOverlay";
import Credits from "./Credits";
import "../styles/MainMenu.css";

export default function MainMenu({ onNewGame, onContinue, onLoadFromFile }) {
  // Track quick-save availability and credits visibility
  const [hasSave, setHasSave] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  // Track fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileInputRef = useRef(null);

  const { storageKey } = useSaveSystem(); // Identify save slot key
  const { t } = useText(); // Access translation function

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
        onLoadFromFile(data);
      } catch (err) {
        console.error("Failed to read save file:", err);
      } finally {
        e.target.value = ""; // Allow selecting the same file again
      }
    },
    [onLoadFromFile]
  );

  // Handle fullscreen mode for the browser
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
            onClick={onContinue}
          >
            {t("ui.mainMenu.continue")}
          </button>
        )}

        <button
          type="button"
          className="main-menu-button"
          onClick={onNewGame}
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
        <button
          type="button"
          className="main-menu-controls-button"
          // Mute button currently inactive (to be wired later)
        >
          Mute
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