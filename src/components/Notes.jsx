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

  // Ref for sidebar scroll area
  const scrollRef = useRef(null);

  // Enable custom scroll arrows for sidebar
  useScrollArrows(scrollRef, { step: 24 });

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
      <div className="window window-notes has-pixelated-borders">
        <h2 className="window-title">{t("ui.notesWindow.title")}</h2>

        {sortedNotes.length > 0 ? (
          <div className="notes-container">
            {/* Sidebar wrapper with scroll arrows */}
            <div className="notes-sidebar-wrapper has-pixelated-corners has-scroll-parent">
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