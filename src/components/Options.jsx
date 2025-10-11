import WindowOverlay from "./WindowOverlay";
import "../styles/Options.css";

export default function Options({ onClose, onSave, onLoad, onExportSave, onImportSave }) {
  return (
    <WindowOverlay onClose={onClose}>
      <div className="options-window">
        <button className="window-close" onClick={onClose}>×</button>
        <h2>Options</h2>
        <div className="window-buttons">
          <button onClick={onSave}>Save</button>
          <button onClick={onLoad}>Load</button>
          <button onClick={onExportSave}>Export Save File</button>
          <button onClick={onImportSave}>Import Save File</button>
        </div>
      </div>
    </WindowOverlay>
  );
}