// Options window with save and load controls
import WindowOverlay from "./WindowOverlay";
import useText from "../hooks/useText";
import "../styles/Options.css";

export default function Options({
  onClose,
  onSave,
  onLoad,
  onExportSave,
  onImportSave,
}) {
  const { t } = useText();

  // Render a modal window with quick save, load, and file management options
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-options">
        {/* Close button in the top-right corner */}
        <button className="window-close" onClick={onClose}>
          ×
        </button>

        <h2 className="window-title">{t("ui.optionsWindow.title")}</h2>

        {/* Action buttons for save, load, export, and import */}
        <div className="window-buttons">
          <button onClick={onSave} className="window-buttons-item">
            {t("ui.optionsWindow.quickSave")}
          </button>
          <button onClick={onLoad} className="window-buttons-item">
            {t("ui.optionsWindow.quickLoad")}
          </button>
          <button onClick={onExportSave} className="window-buttons-item">
            {t("ui.optionsWindow.exportSave")}
          </button>
          <button onClick={onImportSave} className="window-buttons-item">
            {t("ui.optionsWindow.importSave")}
          </button>
        </div>
      </div>
    </WindowOverlay>
  );
}