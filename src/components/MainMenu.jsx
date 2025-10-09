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
      <h1 className="main-menu-title">Paperbacks</h1>
      <div className="menu-menu-options">
        <button className="main-menu-button" onClick={handleNewGameClick}>New Game</button>
        <button className="main-menu-button" disabled>Load Game</button>
        <button className="main-menu-button" disabled>Options</button>
      </div>
    </div>
  );
}