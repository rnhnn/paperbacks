// Entry point that initializes React and mounts the root Game component into the DOM

// React
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Components
import Game from "./Game.jsx";

// Mount the Game component inside the HTML element with id="root"
createRoot(document.getElementById("root")).render(
  // StrictMode enables additional checks during development (no effect in production)
  <StrictMode>
    <Game />
  </StrictMode>
);