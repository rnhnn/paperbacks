import { useState, useEffect } from "react";
import "../styles/LoadingScreen.css";

export default function LoadingScreen({ onComplete }) {
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const MIN_TIME = 1500; // 1.5s minimum display
    const start = performance.now();

    const loadAssets = async () => {
      const font = new FontFace("Grand9KPixelRegular", "url(/src/assets/fonts/Grand9KPixelRegular.woff2)");
      await font.load();
      document.fonts.add(font);

      const portraits = ["julian.png", "kirby.png", "protagonist.png"];
      await Promise.all(
        portraits.map(src => new Promise(res => {
          const img = new Image();
          img.src = `/src/assets/portraits/${src}`;
          img.onload = res;
          img.onerror = res;
        }))
      );

      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_TIME - elapsed);
      setTimeout(() => setReady(true), remaining);
    };

    loadAssets();
  }, []);

  const handleClick = () => {
    if (!ready) return;
    setFadeOut(true);
    // Wait for the CSS fade-out to finish before continuing
    setTimeout(onComplete, 400);
  };

  return (
    <div className="loading-screen">
      {!ready && <p>Loading...</p>}
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