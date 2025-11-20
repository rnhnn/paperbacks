// Display the options window with fullscreen toggle, mute controls, and optional save/load tools

// Styles
import "../styles/Options.css";

// Components
import WindowOverlay from "./WindowOverlay";

// Hooks
import useText from "../hooks/useText";
import useFullscreen from "../hooks/useFullscreen";

// Contexts
import { useAudio } from "../contexts/AudioContext";

export default function Options({
  onClose,
  onSave,
  onLoad,
  onExportSave,
  onImportSave,
  context = "playerMenu", // Added: distinguish between main menu and player menu usage
}) {
  const { t } = useText();
  const { isFullscreen, toggleFullscreen } = useFullscreen(); // Track and toggle fullscreen state
  const { isMuted, toggleMute } = useAudio(); // Track and toggle global mute state

  // Detect if options are opened from main menu
  const isMainMenu = context === "mainMenu";

  // Render options inside window overlay
  return (
    <WindowOverlay onClose={onClose}>
      {/* Outer container stays fixed size */}
      <div className="window window-options has-pixelated-corners">
        <h2 className="window-title">{t("ui.optionsWindow.title")}</h2>

        {/* Action buttons for save, load, export, and import */}
        <div className="window-buttons">
          {/* Only show save/load/export/import in player menu */}
          {!isMainMenu && (
            <>
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
            </>
          )}

          {/* Toggle fullscreen mode */}
          <button onClick={toggleFullscreen} className="window-buttons-item">
            {isFullscreen
              ? t("ui.optionsWindow.windowed")
              : t("ui.optionsWindow.fullscreen")}
          </button>

          {/* Toggle mute state */}
          <button onClick={toggleMute} className="window-buttons-item">
            {isMuted
              ? t("ui.optionsWindow.unmute")
              : t("ui.optionsWindow.mute")}
          </button>
        </div>
      </div>
    </WindowOverlay>
  );
}