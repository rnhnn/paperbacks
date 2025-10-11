import WindowOverlay from "./WindowOverlay";
import "../styles/Notes.css";

export default function Notes({ notes, openNoteId, onToggleNote, onClose }) {
  return (
    <WindowOverlay onClose={onClose}>
      <div className="notes-window">
        <button className="window-close" onClick={onClose}>×</button>
        <h2>Notes</h2>

        {notes.length > 0 ? (
          <ul className="notes-list">
            {notes.map((note) => (
              <li key={note.id} className="notes-item">
                <button
                  className="notes-item-title"
                  onClick={() => onToggleNote(note.id)}
                >
                  {note.title || "No title"}
                </button>
                {openNoteId === note.id && (
                  <div className="notes-item-content">
                    {note.content.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="notes-empty">No notes yet.</p>
        )}
      </div>
    </WindowOverlay>
  );
}