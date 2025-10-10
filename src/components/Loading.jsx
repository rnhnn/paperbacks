// --- React ---
import { useState, useEffect } from "react";

// --- Data & styles ---
import characters from "../data/characters.json";
import "../styles/Loading.css";

export default function Loading({ onComplete }) {
  // --- State ---
  const [fontReady, setFontReady] = useState(false); // font loaded
  const [ready, setReady] = useState(false); // assets + min time done
  const [fadeOut, setFadeOut] = useState(false); // fade-out trigger

  const FADE_DURATION = 400; // match CSS fade timing (ms)

  // --- Load pixel font first ---
  useEffect(() => {
    const loadFont = async () => {
      try {
        const font = new FontFace(
          "Grand9KPixelRegular",
          "url(/assets/fonts/Grand9KPixelRegular.woff2)"
        );
        await font.load();
        document.fonts.add(font);
        setFontReady(true);
      } catch (err) {
        console.error("⚠️ Font failed to load:", err);
        setFontReady(true); // continue even if font fails
      }
    };
    loadFont();
  }, []);

  // --- Load portraits with min display time ---
  useEffect(() => {
    if (!fontReady) return;

    const MIN_TIME = 1500; // minimum screen time (ms)
    const start = performance.now();

    const loadAssets = async () => {
      // Get all portrait filenames from characters.json
      const portraits = Object.values(characters)
        .map((c) => c.portrait)
        .filter(Boolean);

      try {
        // Load portraits in parallel
        await Promise.all(
          portraits.map(
            (src) =>
              new Promise((res) => {
                const img = new Image();
                img.src = `/assets/portraits/${src}`;
                img.onload = res;
                img.onerror = (err) => {
                  console.warn(`⚠️ Failed to load portrait: ${src}`, err);
                  res(); // skip and continue
                };
              })
          )
        );
      } catch (err) {
        console.error("⚠️ Portrait loading failed:", err);
      }

      // Enforce minimum duration
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_TIME - elapsed);
      setTimeout(() => setReady(true), remaining);
    };

    loadAssets();
  }, [fontReady]);

  // --- Fade out and continue to next phase ---
  const handleClick = () => {
    if (!ready) return;
    setFadeOut(true);
    setTimeout(onComplete, FADE_DURATION);
  };

  // --- Render ---
  return (
    <div className="loading-screen">
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