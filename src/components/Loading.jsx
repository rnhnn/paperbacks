// React and context hooks
import { useState, useEffect } from "react";
import { useFlags } from "../contexts/FlagsContext";

// Core helpers
import { isDebugMode } from "../helpers/isDebugMode";

// Data
import characters from "../data/characters.json";
import icons from "../data/icons.json";
import audioData from "../data/audio.json"; // Added: audio manifest for music, ambience, and SFX

// Styles
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

  // Preload portraits, icons, and all audio once the font is ready
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

    // Preload all audio files (music, ambience, and SFX) using smart cache
    const preloadAllAudio = async () => {
      const groups = ["music", "ambience", "sfx"];
      const requests = [];
      const cacheName = "paperbacks-audio-cache-v1";

      // Try to open browser cache, fallback to null when unavailable
      const cache = "caches" in window ? await caches.open(cacheName) : null;

      for (const group of groups) {
        const entries = audioData[group];
        if (!entries) continue;

        for (const [key, file] of Object.entries(entries)) {
          const path = `/assets/audio/${file}`;

          // Log each audio file being preloaded in debug mode
          if (isDebugMode()) {
            console.log(`[Audio Preload] ${group}/${key}: ${path}`);
          }

          if (cache) {
            // Check cache before fetching
            const match = await cache.match(path);
            if (match) {
              if (isDebugMode()) {
                console.log(`[Audio Preload] Cache hit: ${path}`);
              }
              continue; // Skip already cached files
            }

            // Fetch and store file in cache if missing
            requests.push(
              fetch(path)
                .then((response) => {
                  if (response.ok) {
                    cache.put(path, response.clone());
                    if (isDebugMode()) {
                      console.log(`[Audio Preload] Cached: ${path}`);
                    }
                  }
                })
                .catch((err) => {
                  console.warn(`[Audio Preload] Failed to fetch ${path}`, err);
                })
            );
          } else {
            // Fallback: use standard fetch when Cache API is unavailable
            requests.push(
              fetch(path, { method: "GET", cache: "force-cache" }).catch(
                (err) => {
                  console.warn(`[Audio Preload] Failed to load ${path}`, err);
                }
              )
            );
          }
        }
      }

      // Wait for all pending requests to finish
      await Promise.all(requests);
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
          preloadAllAudio(), // Updated: now preloads all audio with cache support
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

  // Handle quick shortcut that skips menu and title card
  // Available only when debug mode is active
  const handleSkipToGame = () => {
    if (!ready) return;
    setLanguage("en"); // Force English for testing
    onComplete("skip"); // Signal debug mode to GameScreen
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
            English!
          </button>
          <button
            className="language-button"
            onClick={() => handleSelectLanguage("es")}
          >
            Español
          </button>

          {/* Show skip button only when debug mode is active */}
          {isDebugMode() && (
            <button className="language-button" onClick={handleSkipToGame}>
              Skip to Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}