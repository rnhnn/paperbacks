// React hook to read and normalize fade duration from CSS
import { useState, useEffect } from "react";

export default function useFadeDuration(defaultMs = 400) {
  // Store final fade duration in milliseconds
  const [fadeDuration, setFadeDuration] = useState(defaultMs);

  useEffect(() => {
    // Read CSS variable once styles are guaranteed to load
    const rootStyles = getComputedStyle(document.documentElement);
    const raw = rootStyles.getPropertyValue("--fade-screen-duration").trim();
    if (!raw) return;

    // Convert seconds to milliseconds when needed
    const value = parseFloat(raw);
    if (isNaN(value)) return;

    const duration = raw.endsWith("ms") ? value : value * 1000;
    setFadeDuration(duration);
  }, [defaultMs]);

  // Return normalized fade duration
  return fadeDuration;
}