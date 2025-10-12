// Options window with save and load controls
import WindowOverlay from "./WindowOverlay";
import "../styles/Options.css";

export default function Options({
  onClose,
  onSave,
  onLoad,
  onExportSave,
  onImportSave,
}) {
  // Render a modal window with quick save, load, and file management options
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-options">
        {/* Close button in the top-right corner */}
        <button className="window-close" onClick={onClose}>
          ×
        </button>

        <h2 className="window-title">Options</h2>

        {/* Action buttons for save, load, export, and import */}
        <div className="window-buttons">
          <button onClick={onSave} className="window-buttons-item">
            Quick Save
          </button>
          <button onClick={onLoad} className="window-buttons-item">
            Quick Load
          </button>
          <button onClick={onExportSave} className="window-buttons-item">
            Export Save File
          </button>
          <button onClick={onImportSave} className="window-buttons-item">
            Import Save File
          </button>
        </div>
      </div>
    </WindowOverlay>
  );
}