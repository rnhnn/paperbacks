// Exit confirmation window
import WindowOverlay from "./WindowOverlay";
import "../styles/Exit.css";

export default function Exit({ onConfirm, onClose }) {
  // Render confirmation modal asking the player if they want to exit to the main menu
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-exit">
        <h2 className="window-title">Exit Game</h2>
        <p className="window-message">
          Are you sure you want to exit to the main menu?
        </p>

        <div>
          {/* Confirm and close buttons */}
          <button
            onClick={() => {
              onClose(); // Close the modal immediately
              onConfirm?.(); // Notify parent (PlayerMenu → GameScreen)
            }}
          >
            Yes
          </button>

          <button onClick={onClose}>No</button>
        </div>
      </div>
    </WindowOverlay>
  );
}