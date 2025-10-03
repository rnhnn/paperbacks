import { useState } from "react";
import { useInventory } from "../context/InventoryContext"; // <-- import inventory hook
import { useNotes } from "../context/NotesContext";         // <-- import notes hook
import itemsData from "../data/items/items.json";           // <-- items database
import notesData from "../data/notes/notes.json";           // <-- notes database
import "../styles/ProtagonistHub.css";
import protagonistImg from "../assets/portraits/protagonist.png";

const ProtagonistHub = () => {
  const [activeTab, setActiveTab] = useState("portrait");

  // Track which notes are open
  const [openNotes, setOpenNotes] = useState({});

  const toggleNote = (id) => {
    setOpenNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
                <li key={item.id}>
                  <strong>{item.name}</strong>
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
                  {openNotes[note.id] && (
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
          <button onClick={() => setActiveTab("portrait")}>Back</button>
        </div>
      )}
    </div>
  );
};

export default ProtagonistHub;