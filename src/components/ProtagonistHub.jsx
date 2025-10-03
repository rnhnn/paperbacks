import "../styles/ProtagonistHub.css";
import protagonistImg from "../assets/portraits/protagonist.png";

const ProtagonistHub = ({ portraitSrc, onInventoryClick, onJournalClick }) => {
  return (
    <div className="protagonist-hub">
      <div className="portrait-container">
        <img
          src={portraitSrc || protagonistImg}
          alt="Protagonist Portrait"
          className="portrait"
        />
      </div>
      <div className="hub-buttons">
        <button onClick={onInventoryClick}>Inventory</button>
        <button onClick={onJournalClick}>Journal</button>
      </div>
    </div>
  );
};

export default ProtagonistHub;