import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import itemsData from "../data/items/items.json";
import notesData from "../data/notes/notes.json";
import "../styles/ProtagonistHub.css";

// Portrait now points to public folder
const protagonistImg = "/assets/portraits/protagonist.png";

const ProtagonistHub = () => {
  const [activeTab, setActiveTab] = useState("portrait");

  // Track which single note is open
  const [openNoteId, setOpenNoteId] = useState(null);

  const toggleNote = (id) => {
    setOpenNoteId((prev) => (prev === id ? null : id));
  };

  // Inventory
  const { inventory } = useInventory();
  const inventoryItems = inventory.map((id) =>
    itemsData.find((item) => item.id === id)
  );

  // Notes
  const { notes } = useNotes();
  const unlockedNotes = notes.map((id) =>
    notesData.find((note) => note.id === id)
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
            <button>Options</button>
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
                  <strong>{item.name}</strong>
                  {item.description && <p>({item.description})</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items yet.</p>
          )}
          <button onClick={() => setActiveTab("portrait")} className="protagonist-hub-inventory-back-button">Back</button>
        </div>
      )}

      {/* Notes (Accordion) */}
      {activeTab === "notes" && (
        <div className="protagonist-hub-notes">
          <h3 className="protagonist-hub-notes-title">Notes</h3>
          {unlockedNotes.length > 0 ? (
            <ul className="protagonist-hub-notes-list">
              {unlockedNotes.map((note) => (
                <li key={note.id} className="protagonist-hub-notes-list-item">
                  {/* Title row */}
                  <button
                    className="protagonist-hub-notes-list-item-title"
                    onClick={() => toggleNote(note.id)}
                  >
                    {note.title}
                  </button>

                  {/* Description (accordion content) */}
                  {openNoteId === note.id && (
                    <div className="protagonist-hub-notes-list-item-description">
                      {note.content.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No notes yet.</p>
          )}
          <button onClick={() => setActiveTab("portrait")} className="protagonist-hub-notes-back-button">Back</button>
        </div>
      )}
    </div>
  );
};

export default ProtagonistHub;
