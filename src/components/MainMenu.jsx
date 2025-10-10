// --- React & styles ---
import { useState, useEffect, useRef } from "react";
import { useSaveSystem } from "../context/SaveSystemContext";
import "../styles/MainMenu.css";

const FADE_DURATION = 400; // ms, matches CSS fade-out

export default function MainMenu({ onNewGame, onContinue, onLoadFromFile }) {
  const [fadeOut, setFadeOut] = useState(false); // triggers fade-out
  const [hasSave, setHasSave] = useState(false); // true if save exists
  const { storageKey } = useSaveSystem(); // from SaveSystemContext
  const fileInputRef = useRef(null); // hidden input ref

  // Check if a local save exists
  useEffect(() => {
    try {
      const save = localStorage.getItem(storageKey);
      setHasSave(Boolean(save));
    } catch (err) {
      console.warn("⚠️ Could not access localStorage:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade transition helper
  const runWithFade = (callback) => {
    setFadeOut(true);
    setTimeout(callback, FADE_DURATION);
  };

  // Trigger file picker
  const handleLoadGameClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Basic validation
      if (!data || typeof data !== "object" || !data.version) {
        console.warn("⚠️ Invalid save file structure");
        return;
      }

      console.log("📂 Loaded save from file:", data);

      runWithFade(() => onLoadFromFile(data));
    } catch (err) {
      console.error("❌ Failed to read save file:", err);
    } finally {
      // Reset input so the same file can be reselected later
      e.target.value = "";
    }
  };

  return (
    <div className={`main-menu ${fadeOut ? "fade-out" : ""}`}>
      <h1 className="main-menu-title">Paperbacks</h1>

      <div className="main-menu-options">
        {hasSave && (
          <button
            type="button"
            className="main-menu-button"
            onClick={() => runWithFade(onContinue)}
          >
            Continue
          </button>
        )}

        <button
          type="button"
          className="main-menu-button"
          onClick={() => runWithFade(onNewGame)}
        >
          New Game
        </button>

        <button
          type="button"
          className="main-menu-button"
          onClick={handleLoadGameClick}
        >
          Load Game
        </button>

        {/* Hidden file input */}
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