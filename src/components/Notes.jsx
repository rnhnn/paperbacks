// React & styles
import { useState, useMemo, useEffect } from "react";
import WindowOverlay from "./WindowOverlay";
import useText from "../hooks/useText";
import "../styles/Notes.css";

export default function Notes({ notes, onClose }) {
  const { t, textData } = useText();

  // Build a quick lookup for localized notes by id
  const localizedById = useMemo(() => {
    const map = Object.create(null);
    for (const n of textData.notes) map[n.id] = n;
    return map;
  }, [textData.notes]);

  // Sort unlocked notes by most recently unlocked first
  const sortedNotes = useMemo(() => {
    return [...notes].reverse();
  }, [notes]);

  // Track the active note being viewed
  const [activeNoteId, setActiveNoteId] = useState(null);

  // Auto-select the most recently unlocked note when opened
  useEffect(() => {
    if (sortedNotes.length > 0) {
      setActiveNoteId(sortedNotes[0].id);
    }
  }, [sortedNotes]);

  // Find currently active note for display
  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    const note = sortedNotes.find((n) => n.id === activeNoteId);
    const loc = localizedById[note?.id] || note;
    return loc || null;
  }, [activeNoteId, sortedNotes, localizedById]);

  // Render notes window
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-notes">
        <h2 className="window-title">{t("ui.notesWindow.title")}</h2>

        {sortedNotes.length > 0 ? (
          <div className="notes-container">
            {/* Sidebar with note titles */}
            <div className="notes-sidebar">
              {sortedNotes.map((note) => {
                const loc = localizedById[note.id] || note;
                const isActive = note.id === activeNoteId;

                return (
                  <button
                    key={note.id}
                    className={`notes-sidebar-item ${
                      isActive ? "is-active" : ""
                    }`}
                    onClick={() => setActiveNoteId(note.id)}
                  >
                    {loc.title || t("ui.notesWindow.noTitle")}
                  </button>
                );
              })}
            </div>

            {/* Content area for active note */}
            <div className="notes-content">
              {activeNote ? (
                <>
                  <h3 className="notes-content-title">
                    {activeNote.title || t("ui.notesWindow.noTitle")}
                  </h3>
                  <div className="notes-content-body">
                    {(activeNote.content || []).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </>
              ) : (
                <p className="notes-empty">{t("ui.notesWindow.empty")}</p>
              )}
            </div>
          </div>
        ) : (
          <p>{t("ui.notesWindow.empty")}</p>
        )}
      </div>
    </WindowOverlay>
  );
}