import { useState, useEffect } from "react";
import "../styles/LoadingScreen.css";

export default function LoadingScreen({ onComplete }) {
  const [fontReady, setFontReady] = useState(false); // stage 1: font loaded
  const [ready, setReady] = useState(false); // stage 2: assets + min time loaded
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const MIN_TIME = 1500; // minimum display time for "Loading..."
    const start = performance.now();

    const loadFont = async () => {
      const font = new FontFace(
        "Grand9KPixelRegular",
        "url(/assets/fonts/Grand9KPixelRegular.woff2)"
      );
      await font.load();
      document.fonts.add(font);
      setFontReady(true);
    };

    loadFont();
  }, []);

  useEffect(() => {
    if (!fontReady) return;

    const MIN_TIME = 1500;
    const start = performance.now();

    const loadAssets = async () => {
      // Load portraits
      const portraits = ["julian.png", "kirby.png", "protagonist.png"];
      await Promise.all(
        portraits.map((src) => new Promise((res) => {
          const img = new Image();
          img.src = `/assets/portraits/${src}`;
          img.onload = res;
          img.onerror = res;
        }))
      );

      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_TIME - elapsed);
      setTimeout(() => setReady(true), remaining);
    };

    loadAssets();
  }, [fontReady]);

  const handleClick = () => {
    if (!ready) return;
    setFadeOut(true);
    setTimeout(onComplete, 400);
  };

  return (
    <div className="loading-screen">
      {fontReady && !ready && <p>Loading...</p>}
      {ready && (
        <button
          className={`start-button fade-in ${fadeOut ? "fade-out" : ""}`}
          onClick={handleClick}
        >
          Click here to start
        </button>
      )}
    </div>
  );
}
