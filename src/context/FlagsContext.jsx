import { createContext, useContext, useState } from "react";
import flagsData from "../data/flags.json";

const FlagsContext = createContext();

export function FlagsProvider({ children }) {
  // Initialize state from flags.json defaults
  const [flags, setFlags] = useState(() => {
    const initialFlags = {};
    for (const key in flagsData) {
      initialFlags[key] = flagsData[key].default;
    }
    return initialFlags;
  });

  // --- Helpers ---

  // Returns current value of a flag
  const getFlag = (flagId) => flags[flagId];

  // Updates the value of a flag
  const setFlag = (flagId, value) => {
    setFlags((prev) => ({
      ...prev,
      [flagId]: value,
    }));
  };

  // For debugging or resetting
  const resetFlags = () => {
    const reset = {};
    for (const key in flagsData) {
      reset[key] = flagsData[key].default;
    }
    setFlags(reset);
  };

  return (
    <FlagsContext.Provider value={{ flags, getFlag, setFlag, resetFlags }}>
      {children}
    </FlagsContext.Provider>
  );
}

// Hook for easy access
export function useFlags() {
  return useContext(FlagsContext);
}