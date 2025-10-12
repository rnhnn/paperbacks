// src/contexts/SaveSystemContext.jsx
import { createContext, useContext, useRef } from "react";
import { useInventory } from "./InventoryContext";
import { useNotes } from "./NotesContext";
import { useFlags } from "./FlagsContext";

const STORAGE_KEY = "paperbacks_quick_save";
const SAVE_VERSION = 1;
const SaveSystemContext = createContext();

export const SaveSystemProvider = ({ children }) => {
  const { items, setItems, inventory } = useInventory();
  const { notes, setNotes, unlockedNotes } = useNotes();
  const { flags, setFlags } = useFlags();

  const lastSavedRef = useRef("");

  // --- Build snapshot for saving ---
  const buildSnapshot = (storyState) => ({
    version: SAVE_VERSION,
    timestamp: Date.now(),
    story: storyState || null,
    inventoryIds: [...inventory],
    noteIds: [...unlockedNotes],
    flags: { ...flags },
  });

  // --- Write snapshot to localStorage ---
  const persist = (snapshot) => {
    try {
      const json = JSON.stringify(snapshot);
      if (json === lastSavedRef.current) return true;
      localStorage.setItem(STORAGE_KEY, json);
      lastSavedRef.current = json;
      console.log("💾 Manual Quick Save:", snapshot);
      return true;
    } catch (err) {
      console.error("❌ Save failed:", err);
      return false;
    }
  };

  // --- Save current game ---
  const quickSave = (storyState) => {
    const snapshot = buildSnapshot(storyState);
    return persist(snapshot);
  };

  // --- Load saved game ---
  const quickLoad = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.warn("⚠️ No save data found");
        return null;
      }
      const data = JSON.parse(raw);
      if (!data) return null;

      if (Array.isArray(data.inventoryIds)) {
        const acquired = new Set(data.inventoryIds);
        setItems((prev) =>
          prev.map((it) => ({ ...it, acquired: acquired.has(it.id) }))
        );
      }

      if (Array.isArray(data.noteIds)) {
        const unlocked = new Set(data.noteIds);
        setNotes((prev) =>
          prev.map((n) => ({ ...n, unlocked: unlocked.has(n.id) }))
        );
      }

      if (data.flags && typeof data.flags === "object") {
        setFlags({ ...data.flags });
      }

      console.log("✅ Quick Load:", data);
      return data.story || null;
    } catch (err) {
      console.error("❌ Load failed:", err);
      return null;
    }
  };

  // --- Expose storageKey so MainMenu can detect saves ---
  return (
    <SaveSystemContext.Provider
      value={{ quickSave, quickLoad, storageKey: STORAGE_KEY }}
    >
      {children}
    </SaveSystemContext.Provider>
  );
};

export const useSaveSystem = () => useContext(SaveSystemContext);