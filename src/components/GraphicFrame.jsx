// Display the active graphic with a simple fade transition

// Styles
import "../styles/GraphicFrame.css";

// React
import { useState, useEffect } from "react";

export default function GraphicFrame({ graphic }) {
  // Track fade state
  const [visible, setVisible] = useState(false);

  // Trigger fade when graphic changes
  useEffect(() => {
    if (!graphic) {
      setVisible(false);
      return;
    }

    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [graphic]);

  // Hide frame when no graphic is provided
  if (!graphic) return null;

  // Render the graphic image
  return (
    <div className={`graphic-frame${visible ? " visible" : ""}`}>
      <img
        src={graphic.src}
        alt={graphic.alt || ""}
      />
    </div>
  );
}