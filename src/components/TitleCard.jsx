// Display a temporary fullscreen title or location card before a scene begins
import { useState, useEffect } from "react";
import "../styles/TitleCard.css";

export default function TitleCard({
  text,
  startDelay = 0,          // Wait before fade-in begins (ms)
  fadeInDuration = 600,     // Fade-in time (ms)
  holdDuration = 3000,      // Time fully visible (ms)
  fadeOutDuration = 700,    // Fade-out time (ms)
  onComplete,
}) {
  // Track whether card is currently visible
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Compute total timeline checkpoints
    const fadeInTime = startDelay;
    const fadeOutTime = startDelay + fadeInDuration + holdDuration;
    const doneTime = fadeOutTime + fadeOutDuration;

    // Trigger fade-in, fade-out, and completion in order
    const showTimer = setTimeout(() => setVisible(true), fadeInTime);
    const hideTimer = setTimeout(() => setVisible(false), fadeOutTime);
    const doneTimer = setTimeout(() => onComplete?.(), doneTime);

    // Clear pending timers on unmount
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, [startDelay, fadeInDuration, holdDuration, fadeOutDuration, onComplete]);

  return (
    <div
      className={`title-card ${visible ? "title-card-visible" : "title-card-hidden"}`}
      // Apply dynamic transition timing to match fade direction
      style={{
        "--title-fade-duration": visible
          ? `${fadeInDuration}ms`
          : `${fadeOutDuration}ms`,
      }}
    >
      <p>{text}</p>
    </div>
  );
}