import { useState, useEffect } from "react";
import "../styles/WindowOverlay.css";

const FADE_DURATION = 300; // ms, matches CSS animations

export default function WindowOverlay({ onClose, children }) {
  const [closing, setClosing] = useState(false); // triggers fade-out

  // --- Handle fade-out before unmount ---
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), FADE_DURATION);
  };

  // --- Handle Escape key ---
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      className={`window-overlay ${closing ? "fade-out" : "fade-in"}`}
      onClick={handleClose}
    >
      <div
        className={`window-content ${closing ? "fade-out" : "fade-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}