// Save system context
import { createContext, useContext, useRef } from "react";
import { useInventory } from "./InventoryContext";
import { useNotes } from "./NotesContext";
import { useFlags } from "./FlagsContext";

const STORAGE_KEY = "paperbacks_quick_save"; // LocalStorage key for quick saves
const SAVE_VERSION = 1; // Current save schema version
const SaveSystemContext = createContext();

export const SaveSystemProvider = ({ children }) => {
  // Access global game data through contexts
  const { items, setItems, inventory } = useInventory();
  const { notes, setNotes, unlockedNotes } = useNotes();
  const { flags, setFlags } = useFlags();

  // Keep a reference to last saved JSON to prevent redundant writes
  const lastSavedRef = useRef("");

  // Build a structured snapshot of the current game state
  const buildSnapshot = (storyState) => ({
    version: SAVE_VERSION,
    timestamp: Date.now(),
    story: storyState || null, // Scene/story data provided by StoryFlow
    inventoryIds: [...inventory], // List of acquired item IDs
    noteIds: [...unlockedNotes], // List of unlocked note IDs
    flags: { ...flags }, // Current flag dictionary
  });

  // Persist a snapshot to localStorage with duplicate prevention
  const persist = (snapshot) => {
    try {
      const json = JSON.stringify(snapshot);
      if (json === lastSavedRef.current) return true; // Skip identical saves
      localStorage.setItem(STORAGE_KEY, json);
      lastSavedRef.current = json;
      console.log("Quick Save:", snapshot);
      return true;
    } catch (err) {
      console.error("Save failed:", err);
      return false;
    }
  };

  // Save the current game state and store it persistently
  const quickSave = (storyState) => {
    const snapshot = buildSnapshot(storyState);
    return persist(snapshot);
  };

  // Load and rehydrate game data from localStorage into memory
  const quickLoad = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.warn("No save data found");
        return null;
      }

      const data = JSON.parse(raw);
      if (!data) return null;

      // Restore inventory acquisition states
      if (Array.isArray(data.inventoryIds)) {
        const acquired = new Set(data.inventoryIds);
        setItems((prev) =>
          prev.map((it) => ({ ...it, acquired: acquired.has(it.id) }))
        );
      }

      // Restore unlocked notes
      if (Array.isArray(data.noteIds)) {
        const unlocked = new Set(data.noteIds);
        setNotes((prev) =>
          prev.map((n) => ({ ...n, unlocked: unlocked.has(n.id) }))
        );
      }

      // Restore all flags
      if (data.flags && typeof data.flags === "object") {
        setFlags({ ...data.flags });
      }

      console.log("Quick Load:", data);
      return data.story || null; // Return story state for StoryFlow
    } catch (err) {
      console.error("Load failed:", err);
      return null;
    }
  };

  // Provide save/load functions and key reference to consuming components
  return (
    <SaveSystemContext.Provider
      value={{ quickSave, quickLoad, storageKey: STORAGE_KEY }}
    >
      {children}
    </SaveSystemContext.Provider>
  );
};

// Hook for convenient access to the save system API
export const useSaveSystem = () => useContext(SaveSystemContext);