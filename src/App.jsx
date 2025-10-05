import { useEffect } from "react";
import "./styles/Variables.css";
import "./styles/Globals.css";
import "./styles/Game.css";
import sceneData from "./data/scenes/intro.json";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";
import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext";

export default function App() {
  useEffect(() => {
    const baseWidth = 960;
    const baseHeight = 540;

    const handleResize = () => {
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;

      // This ensures the game always fills the width (black bars on top/bottom if needed)
      const scale = Math.min(scaleX, scaleY);

      document.documentElement.style.setProperty("--game-scale", scale);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <InventoryProvider>
      <NotesProvider>
        <div className="game">
          <SceneViewer scene={sceneData} />
          <ProtagonistHub />
        </div>
      </NotesProvider>
    </InventoryProvider>
  );
}
