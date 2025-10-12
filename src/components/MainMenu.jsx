// --- React & styles ---
import { useState, useEffect, useRef } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import "../styles/MainMenu.css";

const FADE_DURATION = 400; // ms, matches CSS fade-out timing

export default function MainMenu({ onNewGame, onContinue, onLoadFromFile }) {
  const [fadeOut, setFadeOut] = useState(false); // triggers fade-out transition
  const [hasSave, setHasSave] = useState(false); // true if local save exists
  const { storageKey } = useSaveSystem(); // save system key
  const fileInputRef = useRef(null); // hidden input for file picker

  // --- Detect local save on mount ---
  useEffect(() => {
    try {
      const save = localStorage.getItem(storageKey);
      setHasSave(Boolean(save));
    } catch (err) {
      console.warn("⚠️ Could not access localStorage:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fade helper (runs callback after fade-out) ---
  const runWithFade = (callback) => {
    setFadeOut(true);
    setTimeout(callback, FADE_DURATION);
  };

  // --- Open file picker for importing save ---
  const handleLoadGameClick = () => {
    fileInputRef.current?.click();
  };

  // --- Handle selected save file ---
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // --- Basic validation ---
      if (!data || typeof data !== "object" || !data.version) {
        console.warn("⚠️ Invalid save file structure");
        return;
      }

      console.log("📂 Loaded save from file:", data);
      runWithFade(() => onLoadFromFile(data));
    } catch (err) {
      console.error("❌ Failed to read save file:", err);
    } finally {
      e.target.value = ""; // reset for reselect
    }
  };

  // --- Render ---
  return (
    <div className={`main-menu ${fadeOut ? "fade-out" : ""}`}>
      <h1 className="main-menu-title">Paperbacks</h1>

      <div className="main-menu-options">
        {/* Continue (only shown if save exists) */}
        {hasSave && (
          <button
            type="button"
            className="main-menu-button"
            onClick={() => runWithFade(onContinue)}
          >
            Continue
          </button>
        )}

        {/* Start new game */}
        <button
          type="button"
          className="main-menu-button"
          onClick={() => runWithFade(onNewGame)}
        >
          New Game
        </button>

        {/* Load game from external save file */}
        <button
          type="button"
          className="main-menu-button"
          onClick={handleLoadGameClick}
        >
          Load Game
        </button>

        {/* Hidden input for file import */}
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