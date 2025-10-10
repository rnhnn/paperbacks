// Import React's StrictMode to highlight potential issues during development
import { StrictMode } from "react";
// Import createRoot to initialize and render the React app in the DOM
import { createRoot } from "react-dom/client";
// Import the main game component
import Game from "./Game.jsx";

// Mount the Game component inside the HTML element with id="root"
createRoot(document.getElementById("root")).render(
  // StrictMode runs extra checks in dev mode (has no effect in production)
  <StrictMode>
    <Game />
  </StrictMode>
);