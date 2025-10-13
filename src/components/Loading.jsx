// Loading screen shown before the main menu
import { useState, useEffect } from "react";
import { useFlags } from "../contexts/FlagsContext";
import characters from "../data/characters.json";
import icons from "../data/icons.json";
import "../styles/Loading.css";

export default function Loading({ onComplete }) {
  // Track asset and transition states
  const [fontReady, setFontReady] = useState(false); // True once pixel font has loaded
  const [ready, setReady] = useState(false); // True once assets and min time complete
  const [fadeOut, setFadeOut] = useState(false); // Triggers fade-out animation

  const { setLanguage } = useFlags(); // Access language setter from context

  const FADE_DURATION = 400; // Must match CSS transition timing
  const MIN_TIME = 1500; // Ensures minimum loading duration

  // Load custom pixel font before anything else
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
        setFontReady(true); // Proceed even if font loading fails
      }
    };
    loadFont();
  }, []);

  // Preload all portraits and icons after the font is ready
  useEffect(() => {
    if (!fontReady) return;

    const start = performance.now();

    // Helper to preload an image and resolve even if it errors
    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });

    const loadAssets = async () => {
      // Build portrait paths from character data
      const portraits = Object.values(characters)
        .map((c) => c.portrait)
        .filter(Boolean)
        .map((f) => `/assets/portraits/${f}`);

      // Build icon paths from icons.json
      const iconPaths = icons.map((f) => `/assets/icons/${f}`);

      try {
        // Load all assets in parallel for efficiency
        await Promise.all([...portraits, ...iconPaths].map(loadImage));
      } catch (err) {
        console.error("Asset loading failed:", err);
      }

      // Enforce minimum display duration before ready state
      const elapsed = performance.now() - start;
      const delay = Math.max(0, MIN_TIME - elapsed);
      setTimeout(() => setReady(true), delay);
    };

    loadAssets();
  }, [fontReady]);

  // Handle language selection
  const handleSelectLanguage = (lang) => {
    if (!ready) return;
    setLanguage(lang);
    setFadeOut(true);
    setTimeout(onComplete, FADE_DURATION);
  };

  // Render the loading interface
  return (
    <div className={`loading ${fadeOut ? "fade-out" : ""}`}>
      {/* Display "Loading..." while assets are still processing */}
      {fontReady && !ready && <p className="loading-text">Loading...</p>}

      {/* Show language choices once everything is ready */}
      {ready && (
        <div className="language-select fade-in">
          <button
            className="language-button"
            onClick={() => handleSelectLanguage("en")}
          >
            English
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