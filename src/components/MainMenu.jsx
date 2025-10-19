// React and context hooks
import { useState, useEffect, useRef, useCallback } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import useText from "../hooks/useText";

// Components
import WindowOverlay from "./WindowOverlay";
import Credits from "./Credits";
import Options from "./Options"; // Added: shared options window component
import { playClickSound } from "../helpers/uiSound";

// Styles
import "../styles/MainMenu.css";

export default function MainMenu({ onNewGame, onContinue, onLoadFromFile }) {
  // Track quick-save availability and window visibility
  const [hasSave, setHasSave] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showOptions, setShowOptions] = useState(false); // Added: track options window state

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

  // Render main menu interface
  return (
    <div className="main-menu">
      <h1 className="main-menu-title">{t("ui.mainMenu.title")}</h1>

      <div className="main-menu-options">
        <button
          type="button"
          className="main-menu-button"
          onClick={(e) => {
            playClickSound();
            if (hasSave) onContinue(e);
          }}
          disabled={!hasSave}
        >
          {t("ui.mainMenu.continue")}
        </button>

        <button
          type="button"
          className="main-menu-button"
          onClick={(e) => {
            playClickSound();
            onNewGame(e);
          }}
        >
          {t("ui.mainMenu.newGame")}
        </button>

        <button
          type="button"
          className="main-menu-button"
          onClick={(e) => {
            playClickSound();
            handleLoadGameClick(e);
          }}
        >
          {t("ui.mainMenu.loadGame")}
        </button>

        {/* Open options window */}
        <button
          type="button"
          className="main-menu-button"
          onClick={(e) => {
            playClickSound();
            setShowOptions(true);
          }}
        >
          {t("ui.mainMenu.options")}
        </button>

        <button
          type="button"
          className="main-menu-button"
          onClick={(e) => {
            playClickSound();
            setShowCredits(true);
          }}
        >
          {t("ui.mainMenu.credits")}
        </button>

        {/* Hidden input for external save import */}
        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Show options window with only fullscreen and mute controls */}
      {showOptions && (
        <Options
          context="mainMenu"
          onClose={() => setShowOptions(false)}
        />
      )}

      {/* Show credits window */}
      {showCredits && (
        <Credits onClose={() => setShowCredits(false)} />
      )}
    </div>
  );
}