// Notes window displaying all unlocked notes
import WindowOverlay from "./WindowOverlay";
import "../styles/Notes.css";

export default function Notes({ notes, onClose }) {
  // Render a modal listing all unlocked story notes
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-notes">
        {/* Close button in the top-right corner */}
        <button className="window-close" onClick={onClose}>
          ×
        </button>

        <h2 className="window-title">Notes</h2>

        {/* List all unlocked notes or show an empty message */}
        {notes.length > 0 ? (
          <ul className="notes-list">
            {notes.map((note) => (
              <li key={note.id} className="notes-item">
                {/* Note title */}
                <div className="notes-item-title">
                  {note.title || "No title"}
                </div>

                {/* Note text content rendered as paragraphs */}
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