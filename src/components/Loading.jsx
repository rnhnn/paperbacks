// Preload all fonts, images, and audio before showing language selection

// React and context hooks
import { useState, useEffect } from "react";
import { useFlags } from "../contexts/FlagsContext";

// Core helpers
import { isDebugMode } from "../helpers/isDebugMode";

// Data
import system from "../data/system.json";
import characters from "../data/characters.json";
import items from "../data/items.json";
import audioData from "../data/audio.json";

// Styles
import "../styles/Loading.css";

export default function Loading({ onComplete }) {
  // Track asset loading states
  const [fontReady, setFontReady] = useState(false); // True when pixel font is loaded
  const [ready, setReady] = useState(false); // True when assets and minimum delay complete
  const { setLanguage } = useFlags(); // Control active language
  const MIN_TIME = 1500; // Minimum visible loading time

  // Load pixel font before loading other assets
  useEffect(() => {
    const loadFont = async () => {
      try {
        const font = new FontFace(
          "Grand9KPixelRegular",
          "url(/fonts/Grand9KPixel.woff2)"
        );
        await font.load();
        document.fonts.add(font);
      } catch (err) {
        console.error("Font failed to load:", err);
      } finally {
        setFontReady(true); // Continue even if font fails to load
      }
    };
    loadFont();
  }, []);

  // Preload portraits, items, system images, and all audio after font is ready
  useEffect(() => {
    if (!fontReady) return;

    const start = performance.now();

    // Preload a single image and resolve even if loading fails
    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });

    // Preload all audio groups using Cache API when available
    const preloadAllAudio = async () => {
      const groups = ["music", "ambience", "effects", "system"];
      const requests = [];
      const cacheName = "paperbacks-audio-cache-v1";

      // Open cache if supported, fallback to null otherwise
      const cache = "caches" in window ? await caches.open(cacheName) : null;

      for (const group of groups) {
        const entries = audioData[group];
        if (!entries) continue;

        for (const [key, file] of Object.entries(entries)) {
          const path = `/audio/${file}`;

          // Log each audio file being preloaded in debug mode
          if (isDebugMode()) console.log(`[Audio Preload] ${group}/${key}: ${path}`);

          if (cache) {
            // Skip files already in cache
            const match = await cache.match(path);
            if (match) {
              if (isDebugMode()) console.log(`[Audio Preload] Cache hit: ${path}`);
              continue;
            }

            // Fetch and store file in cache if missing
            requests.push(
              fetch(path)
                .then((response) => {
                  if (response.ok) {
                    cache.put(path, response.clone());
                    if (isDebugMode()) console.log(`[Audio Preload] Cached: ${path}`);
                  }
                })
                .catch((err) =>
                  console.warn(`[Audio Preload] Failed to fetch ${path}`, err)
                )
            );
          } else {
            // Use standard fetch when Cache API is unavailable
            requests.push(
              fetch(path, { method: "GET", cache: "force-cache" }).catch((err) =>
                console.warn(`[Audio Preload] Failed to load ${path}`, err)
              )
            );
          }
        }
      }

      // Wait for all pending requests to complete
      await Promise.all(requests);
    };

    const preloadAssets = async () => {
      // Collect portrait image paths
      const portraits = Object.values(characters)
        .map((c) => c.portrait)
        .filter(Boolean)
        .map((f) => `/portraits/${f}`);

      // Collect item icon paths
      const itemIcons = items.map((it) => it.icon).filter(Boolean);

      // Collect system image paths
      const systemPaths = system.map((f) => `/system/${f}`);

      // Log asset preload details in debug mode
      if (isDebugMode()) {
        portraits.forEach((p) => console.log(`[Image Preload] Portrait: ${p}`));
        itemIcons.forEach((p) => console.log(`[Image Preload] Item: ${p}`));
        systemPaths.forEach((p) => console.log(`[Image Preload] System: ${p}`));
      }

      try {
        // Preload all assets and audio in parallel
        await Promise.all([
          ...systemPaths.map(preloadImage),
          ...itemIcons.map(preloadImage),
          ...portraits.map(preloadImage),
          preloadAllAudio(),
        ]);
      } catch (err) {
        console.error("Asset preload failed:", err);
      }

      // Enforce minimum visible loading duration
      const elapsed = performance.now() - start;
      const delay = Math.max(0, MIN_TIME - elapsed);
      setTimeout(setReady, delay, true);
    };

    preloadAssets();
  }, [fontReady]);

  // Apply selected language and transition to main menu
  const handleSelectLanguage = (lang) => {
    if (!ready) return;
    setLanguage(lang);
    onComplete(); // GameScreen handles music timing
  };

  // Skip menu and title card in debug mode
  const handleSkipToGame = () => {
    if (!ready) return;
    setLanguage("en");
    onComplete("skip");
  };

  // Render loading screen
  return (
    <div className="loading">
      {/* Show "Loading..." text while assets load */}
      {fontReady && !ready && <p className="loading-text">Loading...</p>}

      {/* Show language buttons once loading completes */}
      {ready && (
        <div className="language-select">
          <button
            className="language-select-button"
            onClick={() => handleSelectLanguage("en")}
          >
            English
          </button>
          <button
            className="language-select-button"
            onClick={() => handleSelectLanguage("es")}
          >
            Español
          </button>

          {/* Show skip option in debug mode */}
          {isDebugMode() && (
            <button
              className="language-select-button"
              onClick={handleSkipToGame}
            >
              Skip to Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}