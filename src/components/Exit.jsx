// Exit confirmation window
import WindowOverlay from "./WindowOverlay";
import useText from "../hooks/useText";
import { useAudio } from "../contexts/AudioContext"; // Added
import "../styles/Exit.css";

export default function Exit({ onConfirm, onClose }) {
  const { t } = useText();
  const { stopAmbience } = useAudio(); // Added

  // Render confirmation modal asking the player if they want to exit to the main menu
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-exit">
        <h2 className="window-title">{t("ui.exitWindow.title")}</h2>
        <p className="window-message">{t("ui.exitWindow.message")}</p>

        <div>
          {/* Confirm and close buttons */}
          <button
            onClick={() => {
              stopAmbience(); // Stop any ongoing ambience before exiting
              onClose(); // Close the modal immediately
              onConfirm?.(); // Notify parent (PlayerMenu → GameScreen)
            }}
          >
            {t("ui.exitWindow.confirm")}
          </button>

          <button onClick={onClose}>{t("ui.exitWindow.cancel")}</button>
        </div>
      </div>
    </WindowOverlay>
  );
}