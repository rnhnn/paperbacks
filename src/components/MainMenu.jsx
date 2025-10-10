// --- React & styles ---
import { useState, useEffect } from "react";
import { useSaveSystem } from "../context/SaveSystemContext";
import "../styles/MainMenu.css";

export default function MainMenu({ onNewGame, onContinue }) {
  const [fadeOut, setFadeOut] = useState(false); // triggers fade-out
  const [hasSave, setHasSave] = useState(false); // true if save exists
  const { storageKey } = useSaveSystem(); // from context
  const FADE_DURATION = 400; // ms, matches CSS

  // Detect existing save on mount
  useEffect(() => {
    try {
      const save = localStorage.getItem(storageKey);
      setHasSave(Boolean(save));
    } catch (err) {
      console.warn("⚠️ Could not access localStorage:", err);
    }
  }, [storageKey]);

  // Start new game
  const handleNewGameClick = () => {
    setFadeOut(true);
    setTimeout(() => onNewGame(), FADE_DURATION);
  };

  // Continue previous game
  const handleContinueClick = () => {
    setFadeOut(true);
    setTimeout(() => onContinue(), FADE_DURATION);
  };

  // Note: fade-in handled by GameScreen
  return (
    <div className={`main-menu ${fadeOut ? "fade-out" : ""}`}>
      <h1 className="main-menu-title">Paperbacks</h1>
      <div className="main-menu-options">
        {hasSave && (
          <button className="main-menu-button" onClick={handleContinueClick}>
            Continue
          </button>
        )}
        <button className="main-menu-button" onClick={handleNewGameClick}>
          New Game
        </button>
        <button className="main-menu-button" disabled>
          Options
        </button>
      </div>
    </div>
  );
}