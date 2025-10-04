import "./styles/Variables.css";
import "./styles/Globals.css";
import "./styles/Game.css";
import sceneData from "./data/scenes/intro.json";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";
import { InventoryProvider } from "./context/InventoryContext";
import { NotesProvider } from "./context/NotesContext"; // <-- import notes context

export default function App() {
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
