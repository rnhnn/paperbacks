import { createContext, useContext, useState } from "react";
import notesData from "../data/notes.json"; // single source of all notes

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  // state: notes with current unlocked status
  const [notes, setNotes] = useState(() =>
    notesData.map((note) => ({ ...note, unlocked: !!note.unlocked }))
  );

  // Unlock a note by ID
  const addNote = (noteId) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, unlocked: true } : n
      )
    );
  };

  // Optional: lock a note by ID
  const removeNote = (noteId) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, unlocked: false } : n
      )
    );
  };

  // list of unlocked note IDs
  const unlockedNotes = notes.filter((n) => n.unlocked).map((n) => n.id);

  return (
    <NotesContext.Provider
      value={{
        notes,
        unlockedNotes,
        addNote,
        removeNote,
        setNotes, // 🟢 Exposed for SaveSystem to restore notes from snapshots
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

// Hook to access notes from any component
export const useNotes = () => useContext(NotesContext);