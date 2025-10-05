import { useEffect } from "react";

/** Scales the game to fit the viewport while keeping aspect ratio */
export default function useGameScale(baseWidth = 960, baseHeight = 540) {
  useEffect(() => {
    const handleResize = () => {
      // Calculate scaling based on viewport and base size
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      const scale = Math.min(scaleX, scaleY); // Prevent cropping

      // Update CSS variable for .game scaling
      document.documentElement.style.setProperty("--game-scale", scale);
    };

    handleResize(); // Set initial scale
    window.addEventListener("resize", handleResize); // Listen for resizes
    return () => window.removeEventListener("resize", handleResize); // Cleanup
  }, [baseWidth, baseHeight]);
}
