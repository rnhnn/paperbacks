import WindowOverlay from "./WindowOverlay";
import "../styles/Exit.css"; // optional, or use window styles directly

export default function Exit({ onConfirm, onClose }) {
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-exit">
        <h2 className="window-title">Exit Game</h2>
        <p className="window-message">Are you sure you want to exit to the main menu?</p>

        <div>
          <button
            onClick={() => {
              onClose();
              onConfirm?.(); // notify PlayerMenu -> GameScreen
            }}
          >
            Yes
          </button>
          <button onClick={onClose}>
            No
          </button>
        </div>
      </div>
    </WindowOverlay>
  );
}