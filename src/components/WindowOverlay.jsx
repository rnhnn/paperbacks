// Reusable overlay for modal windows
import { useEffect } from "react";
import "../styles/WindowOverlay.css";

export default function WindowOverlay({ onClose, children }) {
  // Close the overlay when the Escape key is pressed
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Render a semi-transparent overlay that captures clicks outside the modal
  return (
    <div className="window-overlay" onClick={onClose}>
      <div className="window-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}