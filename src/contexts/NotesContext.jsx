// Provide global notes state: unlocked notes, note mutations, and restoration support

// React
import { createContext, useContext, useState } from "react";

// Data
import notesData from "../data/notes.json"; // Master list of all possible notes

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  // Initialize notes from notes.json, marking each with its unlocked status
  const [notes, setNotes] = useState(() =>
    notesData.map((note) => ({ ...note, unlocked: !!note.unlocked }))
  );

  // Unlock a note by its ID if not already unlocked
  const addNote = (noteId) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, unlocked: true } : n
      )
    );
  };

  // Lock a note by its ID (used rarely, mainly for debugging or design control)
  const removeNote = (noteId) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, unlocked: false } : n
      )
    );
  };

  // Compute a list of all unlocked note IDs for quick access
  const unlockedNotes = notes.filter((n) => n.unlocked).map((n) => n.id);

  // Provide notes state and mutators to all child components
  return (
    <NotesContext.Provider
      value={{
        notes, // Full list of note objects
        unlockedNotes, // List of unlocked note IDs
        addNote, // Unlock a note by ID
        removeNote, // Lock a note by ID
        setNotes, // Used internally by SaveSystem to restore note state
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

// Hook for convenient access to the notes system
export const useNotes = () => useContext(NotesContext);