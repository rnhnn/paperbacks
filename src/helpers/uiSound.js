// Provide simple access to UI sounds from anywhere
import { getPlayUISound } from "../contexts/AudioContext";

// Play hover sound effect
export function playHoverSound() {
  const playUISound = getPlayUISound();
  if (playUISound) playUISound("hover");
}

// Play click sound effect, with optional variant key
export function playClickSound(variant = "click") {
  const playUISound = getPlayUISound();
  if (playUISound) playUISound(variant);
}

// Play any custom UI sound by key
export function playUISoundKey(key) {
  const playUISound = getPlayUISound();
  if (playUISound) playUISound(key);
}