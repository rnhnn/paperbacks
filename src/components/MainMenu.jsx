import { useState } from "react";
import "../styles/MainMenu.css";

export default function MainMenu({ onNewGame }) {
  const [fadeOut, setFadeOut] = useState(false);

  const handleNewGameClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      onNewGame(); // triggers App.jsx to mount game
    }, 400); // match CSS fade-out duration
  };

  return (
    <div className={`main-menu ${fadeOut ? "fade-out" : "fade-in"}`}>
      <h1>Paperbacks</h1>
      <div className="menu-options">
        <button onClick={handleNewGameClick}>New Game</button>
        <button disabled>Load Game</button>
        <button disabled>Options</button>
      </div>
    </div>
  );
}
