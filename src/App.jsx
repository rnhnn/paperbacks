import "./styles/Game.css";
import sceneData from "./scenes/intro.json";
import SceneViewer from "./components/SceneViewer";
import ProtagonistHub from "./components/ProtagonistHub";

export default function App() {
  return (
    <div class="game">
      <SceneViewer scene={sceneData} />
      <ProtagonistHub />
    </div>
  );
}
