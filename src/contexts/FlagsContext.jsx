// Provide global story flags and language state, including defaults, persistence, and runtime updates

// React
import { createContext, useContext, useState, useEffect } from "react";

// Data
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

  // Initialize language (default to English, or read from localStorage)
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("language") || "en";
    } catch {
      return "en";
    }
  });

  // Persist language choice
  useEffect(() => {
    try {
      localStorage.setItem("language", language);
    } catch {
      console.warn("Could not persist language setting");
    }
  }, [language]);

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

  // Provide flag state, language, and mutators to all children components
  return (
    <FlagsContext.Provider
      value={{
        flags, // Current flag dictionary
        getFlag, // Read a specific flag
        setFlag, // Update a specific flag
        resetFlags, // Restore default values
        setFlags, // Used internally by SaveSystem
        language, // Current language code ("en", "es", etc.)
        setLanguage, // Change language at runtime
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