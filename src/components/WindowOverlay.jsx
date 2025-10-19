// Reusable overlay for modal windows
import { useEffect, useRef, Children, isValidElement, cloneElement } from "react";
import { playClickSound } from "../helpers/uiSound";
import "../styles/WindowOverlay.css";

export default function WindowOverlay({ onClose, children, autoCloseButton = true }) {
  const contentRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Handle overlay clicks
  const handleOverlayClick = () => onClose();
  const handleContentClick = (e) => e.stopPropagation();

  // Handle close click
  const handleCloseClick = () => {
    playClickSound();
    onClose();
  };

  // Inject close button by cloning .window child only (no full tree replacement)
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

  // Render overlay
  return (
    <div className="window-overlay" onClick={handleOverlayClick}>
      <div
        ref={contentRef}
        className="window-content pixelated-corners"
        onClick={handleContentClick}
      >
        {enhancedChildren}
      </div>
    </div>
  );
}