import { useState, useMemo } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import { useFlags } from "../context/FlagsContext";
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";
import "../styles/ProtagonistHub.css";

const protagonistImg = "/assets/portraits/protagonist.png";

const ProtagonistHub = () => {
  const [activeTab, setActiveTab] = useState("portrait");
  const [openNoteId, setOpenNoteId] = useState(null);

  const toggleNote = (id) => setOpenNoteId((prev) => (prev === id ? null : id));

  const { inventory } = useInventory();
  const { notes } = useNotes();
  const { flags } = useFlags(); // Keep in case we use it later

  // --- Memoized inventory lookup ---
  const inventoryItems = useMemo(
    () => inventory.map((id) => itemsData.find((item) => item.id === id)).filter(Boolean),
    [inventory]
  );

  // --- Memoized unlocked notes lookup ---
  const unlockedNotes = useMemo(
    () => notes.filter((n) => n.unlocked).map((n) => notesData.find((note) => note.id === n.id) || { id: n.id, title: "No title", content: ["No content"] }),
    [notes]
  );

  return (
    <div className="protagonist-hub">
      {/* Portrait */}
      {activeTab === "portrait" && (
        <>
          <div className="protagonist-hub-portrait">
            <img
              src={protagonistImg}
              alt="Protagonist Portrait"
              className="protagonist-hub-portrait-image"
            />
          </div>
          <div className="protagonist-hub-buttons">
            <button onClick={() => setActiveTab("inventory")}>Inventory</button>
            <button onClick={() => setActiveTab("notes")}>Notes</button>
            <button>Options</button> {/* Dummy button, leads nowhere */}
          </div>
        </>
      )}

      {/* Inventory */}
      {activeTab === "inventory" && (
        <div className="protagonist-hub-inventory">
          <h3 className="protagonist-hub-inventory-title">Inventory</h3>
          {inventoryItems.length > 0 ? (
            <ul className="protagonist-hub-inventory-list">
              {inventoryItems.map((item) => (
                <li key={item.id} className="protagonist-hub-inventory-list-item">
                  <strong>{item.name || "No name"}</strong>
                  {item.description && <p>({item.description})</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items yet.</p>
          )}
          <button onClick={() => setActiveTab("portrait")}>Back</button>
        </div>
      )}

      {/* Notes */}
      {activeTab === "notes" && (
        <div className="protagonist-hub-notes">
          <h3 className="protagonist-hub-notes-title">Notes</h3>
          {unlockedNotes.length > 0 ? (
            <ul className="protagonist-hub-notes-list">
              {unlockedNotes.map((note) => (
                <li key={note.id} className="protagonist-hub-notes-list-item">
                  <button
                    className="protagonist-hub-notes-list-item-title"
                    onClick={() => toggleNote(note.id)}
                  >
                    {note.title || "No title"}
                  </button>
                  {openNoteId === note.id && (
                    <div className="protagonist-hub-notes-list-item-description">
                      {note.content.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No notes yet.</p>
          )}
          <button onClick={() => setActiveTab("portrait")}>Back</button>
        </div>
      )}
    </div>
  );
};

export default ProtagonistHub;