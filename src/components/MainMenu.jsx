import { useEffect, useState } from "react";
import "../styles/MainMenu.css";

export default function MainMenu({ onNewGame }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in after small delay (prevents flash if loaded instantly)
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`main-menu ${visible ? "fade-in" : ""}`}>
      <h1>Paperbacks</h1>
      <div className="menu-options">
        <button onClick={onNewGame}>New Game</button>
        <button disabled>Load Game</button>
        <button disabled>Options</button>
      </div>
    </div>
  );
}
