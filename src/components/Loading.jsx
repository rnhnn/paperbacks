// Loading screen shown before the main menu
import { useState, useEffect } from "react";
import { useFlags } from "../contexts/FlagsContext";
import characters from "../data/characters.json";
import icons from "../data/icons.json";
import audioData from "../data/audio.json"; // Added: main menu audio manifest
import "../styles/Loading.css";

export default function Loading({ onComplete }) {
  // Track asset loading states
  const [fontReady, setFontReady] = useState(false); // True once pixel font is loaded
  const [ready, setReady] = useState(false); // True once assets and min time complete
  const { setLanguage } = useFlags(); // Control active language
  const MIN_TIME = 1500; // Minimum visible loading time

  // Load pixel font before any other assets
  useEffect(() => {
    const loadFont = async () => {
      try {
        const font = new FontFace(
          "Grand9KPixelRegular",
          "url(/assets/fonts/Grand9KPixelRegular.woff2)"
        );
        await font.load();
        document.fonts.add(font);
      } catch (err) {
        console.error("Font failed to load:", err);
      } finally {
        setFontReady(true); // Continue even if loading fails
      }
    };
    loadFont();
  }, []);

  // Preload portraits, icons, and music once the font is ready
  useEffect(() => {
    if (!fontReady) return;

    const start = performance.now();

    // Preload a single image and resolve even on error
    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });

    // Preload main menu music into cache
    const preloadAudio = async () => {
      const track = audioData.music?.mainMenu;
      if (!track) return;
      try {
        await fetch(`/assets/audio/${track}`, {
          method: "GET",
          cache: "force-cache",
        });
      } catch (err) {
        console.warn("Audio preload failed:", err);
      }
    };

    const preloadAssets = async () => {
      // Collect portrait paths from character data
      const portraits = Object.values(characters)
        .map((c) => c.portrait)
        .filter(Boolean)
        .map((f) => `/assets/portraits/${f}`);

      // Collect icon paths from icons.json
      const iconPaths = icons.map((f) => `/assets/icons/${f}`);

      try {
        // Load all assets and audio in parallel
        await Promise.all([
          ...portraits.map(preloadImage),
          ...iconPaths.map(preloadImage),
          preloadAudio(),
        ]);
      } catch (err) {
        console.error("Asset preload failed:", err);
      }

      // Wait remaining time to enforce minimum loading duration
      const elapsed = performance.now() - start;
      const delay = Math.max(0, MIN_TIME - elapsed);
      setTimeout(setReady, delay, true);
    };

    preloadAssets();
  }, [fontReady]);

  // Handle language selection and transition to main menu
  const handleSelectLanguage = (lang) => {
    if (!ready) return;
    setLanguage(lang); // Apply selected language
    onComplete(); // GameScreen will handle music timing
  };

  // Render the loading UI
  return (
    <div className="loading">
      {/* Show "Loading..." until assets are ready */}
      {fontReady && !ready && <p className="loading-text">Loading...</p>}

      {/* Show language options once assets are ready */}
      {ready && (
        <div className="language-select">
          <button
            className="language-button"
            onClick={() => handleSelectLanguage("en")}
          >
            English!!
          </button>
          <button
            className="language-button"
            onClick={() => handleSelectLanguage("es")}
          >
            Español
          </button>
        </div>
      )}
    </div>
  );
}