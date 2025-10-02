import SceneViewer from "./components/SceneViewer";
import sceneData from "./scenes/intro.json";

export default function App() {
  return (
    <div>
      <SceneViewer scene={sceneData} />
    </div>
  );
}
