// Display the notes window with a scrollable sidebar, active note viewer, and localized content

// Styles
import "../styles/Notes.css";
import "../styles/ScrollArrows.css";

// React
import { useState, useMemo, useEffect, useRef } from "react";

// Components
import WindowOverlay from "./WindowOverlay";

// Hooks
import useText from "../hooks/useText";
import useScrollArrows from "../hooks/useScrollArrows";

export default function Notes({ notes, onClose, onNoteRead }) {
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

  // Ref for sidebar scroll area
  const scrollRef = useRef(null);

  // Ref to track previous note count for smarter auto-selection
  const previousCountRef = useRef(0);

  // Enable custom scroll arrows for sidebar
  useScrollArrows(scrollRef, { step: 24 });

  // Auto-select a note when needed:
  // - first time notes appear
  // - when a new note is added (count increases)
  // - when the currently active note no longer exists
  useEffect(() => {
    const count = sortedNotes.length;
    const prevCount = previousCountRef.current;
    previousCountRef.current = count;

    if (count === 0) {
      // No notes → clear selection
      if (activeNoteId !== null) {
        setActiveNoteId(null);
      }
      return;
    }

    const stillExists = sortedNotes.some((n) => n.id === activeNoteId);

    // First time we get notes, or current note vanished
    if ((prevCount === 0 && count > 0 && activeNoteId === null) || !stillExists) {
      setActiveNoteId(sortedNotes[0].id);
      return;
    }

    // A new note was added (count increased) while keeping current selection valid.
    // Decide whether to jump to the newest note; here we do, for "new note" behavior.
    if (count > prevCount) {
      setActiveNoteId(sortedNotes[0].id);
    }
  }, [sortedNotes, activeNoteId]);

  // Mark active note as read when it becomes selected
  useEffect(() => {
    if (activeNoteId && typeof onNoteRead === "function") {
      onNoteRead(activeNoteId);
    }
  }, [activeNoteId]);

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
      <h2 className="window-title">{t("ui.notesWindow.title")}</h2>
      <div className="window window-notes has-pixelated-borders">

        {sortedNotes.length > 0 ? (
          <div className="notes-container">
            {/* Sidebar wrapper with scroll arrows */}
            <div className="notes-sidebar-wrapper has-pixelated-borders has-scroll-parent">
              <div ref={scrollRef} className="notes-sidebar has-scroll">
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