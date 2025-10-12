// Main menu screen
import { useState, useEffect, useRef } from "react";
import { useSaveSystem } from "../contexts/SaveSystemContext";
import "../styles/MainMenu.css";

const FADE_DURATION = 400; // Duration in ms, must match CSS fade timing

export default function MainMenu({ onNewGame, onContinue, onLoadFromFile }) {
  // Control fade-out transition when moving to a new phase
  const [fadeOut, setFadeOut] = useState(false);

  // Track if a local quick save exists to enable the Continue button
  const [hasSave, setHasSave] = useState(false);

  // Access localStorage key from the save system
  const { storageKey } = useSaveSystem();

  // Ref for hidden file input used to import save files
  const fileInputRef = useRef(null);

  // Check if local save data exists when the menu mounts
  useEffect(() => {
    try {
      const save = localStorage.getItem(storageKey);
      setHasSave(Boolean(save));
    } catch (err) {
      console.warn("Could not access localStorage:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Run a transition fade-out before executing a callback (e.g., starting a game)
  const runWithFade = (callback) => {
    setFadeOut(true);
    setTimeout(callback, FADE_DURATION);
  };

  // Open hidden file picker to import an external save
  const handleLoadGameClick = () => {
    fileInputRef.current?.click();
  };

  // Read and validate the selected save file, then pass it to parent loader
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate save structure before applying
      if (!data || typeof data !== "object" || !data.version) {
        console.warn("Invalid save file structure");
        return;
      }

      console.log("Loaded save from file:", data);
      runWithFade(() => onLoadFromFile(data));
    } catch (err) {
      console.error("Failed to read save file:", err);
    } finally {
      e.target.value = ""; // Reset input so the same file can be reselected
    }
  };

  // Render the main menu interface
  return (
    <div className={`main-menu ${fadeOut ? "fade-out" : ""}`}>
      <h1 className="main-menu-title">Paperbacks</h1>

      <div className="main-menu-options">
        {/* Continue button appears only if a quick save is found */}
        {hasSave && (
          <button
            type="button"
            className="main-menu-button"
            onClick={() => runWithFade(onContinue)}
          >
            Continue
          </button>
        )}

        {/* Start a new game from the beginning */}
        <button
          type="button"
          className="main-menu-button"
          onClick={() => runWithFade(onNewGame)}
        >
          New Game
        </button>

        {/* Import a save file manually from disk */}
        <button
          type="button"
          className="main-menu-button"
          onClick={handleLoadGameClick}
        >
          Load Game
        </button>

        {/* Hidden input element for selecting .json save files */}
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