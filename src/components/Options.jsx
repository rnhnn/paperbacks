import WindowOverlay from "./WindowOverlay";
import "../styles/Options.css";

export default function Options({ onClose, onSave, onLoad, onExportSave, onImportSave }) {
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-options">
        <button className="window-close" onClick={onClose}>×</button>
        <h2 className="window-title">Options</h2>
        <div className="window-buttons">
          <button onClick={onSave} className="window-buttons-item">Save</button>
          <button onClick={onLoad} className="window-buttons-item">Load</button>
          <button onClick={onExportSave} className="window-buttons-item">Export Save File</button>
          <button onClick={onImportSave} className="window-buttons-item">Import Save File</button>
        </div>
      </div>
    </WindowOverlay>
  );
}