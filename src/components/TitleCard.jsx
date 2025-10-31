// Display a timed fullscreen title card that fades in, holds, and fades out

// React hooks
import { useState, useEffect } from "react";

// Styles
import "../styles/TitleCard.css";

export default function TitleCard({
  text,
  startDelay = 0, // Wait before fade-in begins (ms)
  fadeInDuration = 600, // Fade-in time (ms)
  holdDuration = 3000, // Time fully visible (ms)
  fadeOutDuration = 700, // Fade-out time (ms)
  onComplete,
}) {
  // Track current visibility state
  const [visible, setVisible] = useState(false);

  // Control fade-in, hold, and fade-out sequence
  useEffect(() => {
    // Calculate timeline checkpoints
    const fadeInTime = startDelay;
    const fadeOutTime = startDelay + fadeInDuration + holdDuration;
    const doneTime = fadeOutTime + fadeOutDuration;

    // Schedule fade transitions and completion callback
    const showTimer = setTimeout(() => setVisible(true), fadeInTime);
    const hideTimer = setTimeout(() => setVisible(false), fadeOutTime);
    const doneTimer = setTimeout(() => onComplete?.(), doneTime);

    // Clear timers if component unmounts early
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, [startDelay, fadeInDuration, holdDuration, fadeOutDuration, onComplete]);

  // Render animated title card
  return (
    <div
      className={`title-card ${visible ? "title-card-visible" : "title-card-hidden"}`}
      // Match transition duration to current fade direction
      style={{
        "--title-fade-duration": visible
          ? `${fadeInDuration}ms`
          : `${fadeOutDuration}ms`,
      }}
    >
      {/* Render HTML-formatted text */}
      <p dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}