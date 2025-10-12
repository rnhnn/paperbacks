// --- React ---
import { useState, useEffect } from "react";

// --- Data & styles ---
import characters from "../data/characters.json";
import icons from "../data/icons.json";
import "../styles/Loading.css";

export default function Loading({ onComplete }) {
  // --- State ---
  const [fontReady, setFontReady] = useState(false); // true when pixel font loaded
  const [ready, setReady] = useState(false); // true when assets + min time done
  const [fadeOut, setFadeOut] = useState(false); // triggers fade-out

  const FADE_DURATION = 400; // ms, matches CSS transition
  const MIN_TIME = 1500; // ms, ensures minimum display time

  // --- Load pixel font ---
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
        console.error("⚠️ Font failed to load:", err);
      } finally {
        setFontReady(true); // continue regardless of success
      }
    };
    loadFont();
  }, []);

  // --- Load portraits + icons after font ---
  useEffect(() => {
    if (!fontReady) return;

    const start = performance.now();

    // Utility: preload image and resolve even on error
    const loadImage = (src) =>
      new Promise((res) => {
        const img = new Image();
        img.onload = res;
        img.onerror = res;
        img.src = src;
      });

    const loadAssets = async () => {
      // Build portrait paths from characters.json
      const portraits = Object.values(characters)
        .map((c) => c.portrait)
        .filter(Boolean)
        .map((f) => `/assets/portraits/${f}`);

      // Build icon paths from icons.json
      const iconPaths = icons.map((f) => `/assets/icons/${f}`);

      try {
        // Load all assets in parallel
        await Promise.all([...portraits, ...iconPaths].map(loadImage));
      } catch (err) {
        console.error("⚠️ Asset loading failed:", err);
      }

      // Enforce minimum time before continue
      const elapsed = performance.now() - start;
      const delay = Math.max(0, MIN_TIME - elapsed);
      setTimeout(() => setReady(true), delay);
    };

    loadAssets();
  }, [fontReady]);

  // --- Handle start click ---
  const handleClick = () => {
    if (!ready) return;
    setFadeOut(true);
    setTimeout(onComplete, FADE_DURATION);
  };

  // --- Render ---
  return (
    <div className="loading">
      {fontReady && !ready && <p className="loading-text">Loading...</p>}
      {ready && (
        <button
          className={`start-button ${fadeOut ? "fade-out" : "fade-in"}`}
          onClick={handleClick}
        >
          Click here to start
        </button>
      )}
    </div>
  );
}