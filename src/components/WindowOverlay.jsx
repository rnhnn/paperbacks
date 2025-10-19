// Provide a reusable overlay layer for modal windows
import { useEffect, Children, isValidElement, cloneElement } from "react";
import { playClickSound } from "../helpers/uiSound";
import "../styles/WindowOverlay.css";

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
  const handleContentClick = (e) => e.stopPropagation();

  // Play sound and close window when pressing the X button
  const handleCloseClick = () => {
    playClickSound();
    onClose();
  };

  // Automatically insert a close button at the top of any .window element
  const enhancedChildren = Children.map(children, (child) => {
    if (
      isValidElement(child) &&
      typeof child.props.className === "string" &&
      child.props.className.includes("window") &&
      autoCloseButton
    ) {
      return cloneElement(child, {
        children: (
          <>
            <button className="window-close" onClick={handleCloseClick}>
              ×
            </button>
            {child.props.children}
          </>
        ),
      });
    }
    return child;
  });

  // Render a darkened overlay behind the modal window
  return (
    <div className="window-overlay" onClick={handleOverlayClick}>
      <div className="window-content pixelated-corners" onClick={handleContentClick}>
        {enhancedChildren}
      </div>
    </div>
  );
}