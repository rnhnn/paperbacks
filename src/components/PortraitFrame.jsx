// Display the active portrait with a simple fade transition

// Styles
import "../styles/PortraitFrame.css";

// React
import { useState, useEffect } from "react";

export default function PortraitFrame({ info }) {
  // Track fade state
  const [visible, setVisible] = useState(false);

  // Trigger fade when portrait changes
  useEffect(() => {
    if (!info) {
      setVisible(false);
      return;
    }

    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [info]);

  // Hide frame when no portrait is provided
  if (!info) return null;

  // Render portrait image
  return (
    <div className={`portrait-frame${visible ? " visible" : ""}`}>
      <img
        src={`/portraits/${info.portrait}`}
        alt={info.name}
      />
    </div>
  );
}