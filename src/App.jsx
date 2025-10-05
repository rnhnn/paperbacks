import "./styles/Variables.css";
import "./styles/Globals.css";

import sceneData from "./data/scenes/intro.json";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";

import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext";

import useGameScale from "./hooks/useGameScale";

export default function App() {
  // Automatically manages game scaling and viewport fitting
  useGameScale(960, 540);

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
