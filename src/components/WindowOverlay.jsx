// Provide a reusable modal overlay with click-outside close, ESC support, and an optional close button

// Styles
import "../styles/WindowOverlay.css";

// React
import { useEffect } from "react";

// Helpers
import { playClickSound } from "../helpers/uiSound";

export default function WindowOverlay({ onClose, children, autoCloseButton = true }) {
  // Close window when the Escape key is pressed
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close overlay when clicking outside the window
  const handleOverlayClick = () => onClose();

  // Prevent click events inside window from closing it
  const handleFrameClick = (e) => e.stopPropagation();

  // Play sound and close window when pressing the X button
  const handleCloseClick = () => {
    playClickSound();
    onClose();
  };

  return (
    <div className="window-overlay" onClick={handleOverlayClick}>
      {/* Make a positioning context that wraps the clipped window */}
      <div className="window-frame" onClick={handleFrameClick}>
        {/* Keep pixelated corners as the outer clipped box */}
        <div className="window-content pixelated-corners">{children}</div>

        {/* Place close button as sibling so it is not clipped */}
        {autoCloseButton && (
          <button
            className="window-close"
            aria-label="Close"
            onClick={handleCloseClick}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}