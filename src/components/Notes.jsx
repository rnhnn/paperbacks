import WindowOverlay from "./WindowOverlay";
import "../styles/Notes.css";

export default function Notes({ notes, onClose }) {
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-notes">
        <button className="window-close" onClick={onClose}>×</button>
        <h2 className="window-title">Notes</h2>

        {notes.length > 0 ? (
          <ul className="notes-list">
            {notes.map((note) => (
              <li key={note.id} className="notes-item">
                <div className="notes-item-title">
                  {note.title || "No title"}
                </div>
                <div className="notes-item-content">
                  {note.content.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No notes yet.</p>
        )}
      </div>
    </WindowOverlay>
  );
}