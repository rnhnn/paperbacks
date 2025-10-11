import { useEffect } from "react";
import "../styles/WindowOverlay.css";

export default function WindowOverlay({ onClose, children }) {
  // --- Handle Escape key ---
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="window-overlay" onClick={onClose}>
      <div className="window-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}