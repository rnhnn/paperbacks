import { createContext, useContext, useState } from "react";
import startingNotes from "../data/notes/startingNotes.json" assert { type: "json" };

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  // notes stores only unlocked note IDs, initialized with starting notes
  const [notes, setNotes] = useState([...startingNotes]);

  /**
   * Unlock a note by ID if not already unlocked
   */
  const addNote = (noteId) => {
    setNotes((prev) => {
      if (!prev.includes(noteId)) return [...prev, noteId];
      return prev;
    });
  };

  /**
   * Optional: Remove a note by ID
   * Usually notes are read-only, so this might rarely be used
   */
  const removeNote = (noteId) => {
    setNotes((prev) => prev.filter((n) => n !== noteId));
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, removeNote }}>
      {children}
    </NotesContext.Provider>
  );
};

/**
 * Hook to access unlocked notes from any component
 */
export const useNotes = () => useContext(NotesContext);