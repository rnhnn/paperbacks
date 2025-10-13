// Import React hooks
import { useState, useEffect, useRef, useCallback } from "react";

// Import contexts and utilities
import { useSaveSystem } from "../contexts/SaveSystemContext";
import useText from "../hooks/useText";

// Import styles
import "../styles/MainMenu.css";

const FADE_DURATION = 400; // ms, must match CSS transition

export default function MainMenu({ onNewGame, onContinue, onLoadFromFile }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const fileInputRef = useRef(null);

  const { storageKey } = useSaveSystem();
  const { t } = useText();

  // Check for quick save existence once
  useEffect(() => {
    try {
      setHasSave(Boolean(localStorage.getItem(storageKey)));
    } catch (err) {
      console.warn("Could not access localStorage:", err);
    }
  }, [storageKey]);

  // Helper: run a transition before executing an action
  const runWithFade = useCallback(
    (callback) => {
      setFadeOut(true);
      setTimeout(callback, FADE_DURATION);
    },
    []
  );

  // Open hidden file input to import save
  const handleLoadGameClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Read and validate external save file
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
        runWithFade(() => onLoadFromFile(data));
      } catch (err) {
        console.error("Failed to read save file:", err);
      } finally {
        e.target.value = ""; // Allow reselecting the same file
      }
    },
    [onLoadFromFile, runWithFade]
  );

  return (
    <div className={`main-menu ${fadeOut ? "fade-out" : ""}`}>
      <h1 className="main-menu-title">{t("ui.mainMenu.title")}</h1>

      <div className="main-menu-options">
        {hasSave && (
          <button
            type="button"
            className="main-menu-button"
            onClick={() => runWithFade(onContinue)}
          >
            {t("ui.mainMenu.continue")}
          </button>
        )}

        <button
          type="button"
          className="main-menu-button"
          onClick={() => runWithFade(onNewGame)}
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

        <input
          type="file"
          accept=".json,application/json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}