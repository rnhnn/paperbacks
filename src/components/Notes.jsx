// Notes window displaying all unlocked notes
import { useMemo } from "react";
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

  // Render a modal listing all unlocked story notes
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-notes">
        {/* Close button in the top-right corner */}
        <button className="window-close" onClick={onClose}>
          ×
        </button>

        <h2 className="window-title">{t("ui.notesWindow.title")}</h2>

        {/* List all unlocked notes or show an empty message */}
        {notes.length > 0 ? (
          <ul className="notes-list">
            {notes.map((note) => {
              // Prefer localized note if available, fall back to base
              const loc = localizedById[note.id] || note;

              return (
                <li key={note.id} className="notes-item">
                  {/* Note title */}
                  <div className="notes-item-title">
                    {loc.title || t("ui.notesWindow.noTitle")}
                  </div>

                  {/* Note text content rendered as paragraphs */}
                  <div className="notes-item-content">
                    {(loc.content || []).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{t("ui.notesWindow.empty")}</p>
        )}
      </div>
    </WindowOverlay>
  );
}