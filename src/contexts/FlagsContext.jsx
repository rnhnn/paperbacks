// Flags context
import { createContext, useContext, useState } from "react";
import flagsData from "../data/flags.json";

const FlagsContext = createContext();

export function FlagsProvider({ children }) {
  // Initialize flag state using defaults from flags.json
  const [flags, setFlags] = useState(() => {
    const initialFlags = {};
    for (const key in flagsData) {
      initialFlags[key] = flagsData[key].default;
    }
    return initialFlags;
  });

  // Return the current value of a specific flag
  const getFlag = (flagId) => flags[flagId];

  // Update a single flag by id with the given value
  const setFlag = (flagId, value) => {
    setFlags((prev) => ({
      ...prev,
      [flagId]: value,
    }));
  };

  // Reset all flags to their default values from flags.json
  const resetFlags = () => {
    const reset = {};
    for (const key in flagsData) {
      reset[key] = flagsData[key].default;
    }
    setFlags(reset);
  };

  // Provide flag state and mutators to all children components
  return (
    <FlagsContext.Provider
      value={{
        flags, // Current flag dictionary
        getFlag, // Read a specific flag
        setFlag, // Update a specific flag
        resetFlags, // Restore default values
        setFlags, // Used internally by SaveSystem to overwrite all flags
      }}
    >
      {children}
    </FlagsContext.Provider>
  );
}

// Hook for convenient access to the Flags context
export function useFlags() {
  return useContext(FlagsContext);
}