// Manage browser fullscreen state and toggling
import { useState, useEffect, useCallback } from "react";

export default function useFullscreen() {
  // Track whether document is currently fullscreen
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement)
  );

  // Listen for fullscreen changes to stay in sync
  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // Toggle fullscreen mode on or off
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore browsers that block fullscreen without user gesture
    }
  }, []);

  // Return fullscreen state and control function
  return { isFullscreen, toggleFullscreen };
}