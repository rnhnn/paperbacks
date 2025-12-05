// Display an exit confirmation window that stops ambience and returns to the main menu

// Styles
import "../styles/Exit.css";

// Components
import WindowOverlay from "./WindowOverlay";

// Hooks
import useText from "../hooks/useText";
import { useAudio } from "../contexts/AudioContext";

export default function Exit({ onConfirm, onClose }) {
  const { t } = useText();
  const { stopAmbience } = useAudio(); // Added

  // Render confirmation modal asking the player if they want to exit to the main menu
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-exit has-pixelated-borders">
        <h2 className="window-title">{t("ui.exitWindow.title")}</h2>
        <p className="window-message">{t("ui.exitWindow.message")}</p>

        <div className="window-exit-buttons">
          {/* Confirm and close buttons */}
          <button
            className="window-buttons-item"
            onClick={() => {
              stopAmbience(); // Stop any ongoing ambience before exiting
              onClose(); // Close the modal immediately
              onConfirm?.(); // Notify parent (PlayerMenu → GameScreen)
            }}
          >
            {t("ui.exitWindow.confirm")}
          </button>

          <button 
            className="window-buttons-item" 
            onClick={onClose}>{t("ui.exitWindow.cancel")}
          </button>
        </div>
      </div>
    </WindowOverlay>
  );
}