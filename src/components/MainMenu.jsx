import { useState } from "react";
import "../styles/MainMenu.css";

export default function MainMenu({ onNewGame }) {
  const [fadeOut, setFadeOut] = useState(false); // triggers fade-out when starting game

  const handleNewGameClick = () => {
    setFadeOut(true); // fade out menu content
    setTimeout(() => {
      onNewGame(); // triggers Game.jsx to mount the game scene
    }, 400); // match CSS fade-out duration
  };

  // Note: screen-level fade-in handled by game-screen-transition in Game.jsx
  return (
    <div className="main-menu">
      <h1>Paperbacks</h1>
      <div className="menu-options">
        <button onClick={handleNewGameClick}>New Game</button>
        <button disabled>Load Game</button>
        <button disabled>Options</button>
      </div>
    </div>
  );
}