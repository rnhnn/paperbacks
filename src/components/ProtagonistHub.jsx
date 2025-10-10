import { useState, useMemo, useRef } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import { useFlags } from "../context/FlagsContext";
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";
import "../styles/ProtagonistHub.css";

const protagonistImg = "/assets/portraits/protagonist.png";
const FADE_DURATION = 400; // ms, matches CSS transitions

export default function ProtagonistHub({ onQuickSave, onQuickLoad, getSceneSnapshot }) {
  const [activeTab, setActiveTab] = useState("portrait"); // current tab
  const [openNoteId, setOpenNoteId] = useState(null); // expanded note
  const [saveMsg, setSaveMsg] = useState(""); // feedback message
  const fileInputRef = useRef(null); // hidden file input for import

  const toggleNote = (id) => setOpenNoteId((prev) => (prev === id ? null : id));

  const { inventory } = useInventory();
  const { notes } = useNotes();
  const { flags } = useFlags();

  // --- Feedback helper ---
  const flashMsg = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 1500);
  };

  // --- LocalStorage quick save ---
  const handleQuickSave = () => {
    if (onQuickSave) {
      onQuickSave();
      flashMsg("Saved ✓");
    }
  };

  // --- LocalStorage quick load ---
  const handleQuickLoad = () => {
    if (onQuickLoad) {
      onQuickLoad();
      flashMsg("Loaded ✓");
    }
  };

  // --- Export save file (includes scene snapshot) ---
  const handleExportSave = () => {
    try {
      const sceneData =
        typeof getSceneSnapshot === "function" ? getSceneSnapshot() : null;

      const snapshot = {
        version: 1,
        timestamp: Date.now(),
        scene: sceneData, // include scene progress
        inventoryIds: [...inventory],
        noteIds: notes.filter((n) => n.unlocked).map((n) => n.id),
        flags: { ...flags },
      };

      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `paperbacks-save-${timestamp}.json`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      flashMsg("Exported ✓");
    } catch (err) {
      console.error("❌ Export failed:", err);
      flashMsg("Export failed ❌");
    }
  };

  // --- Import save file from disk ---
  const handleImportSave = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data || typeof data !== "object" || !data.version) {
        console.warn("⚠️ Invalid save file");
        flashMsg("Invalid File ❌");
        return;
      }

      // Save imported file to localStorage for consistency
      localStorage.setItem("paperbacks_quick_save", JSON.stringify(data));

      if (onQuickLoad) onQuickLoad(); // trigger load after import
      flashMsg("Imported ✓");
    } catch (err) {
      console.error("❌ Import failed:", err);
      flashMsg("Import failed ❌");
    } finally {
      e.target.value = ""; // reset file input
    }
  };

  // --- Memoized inventory ---
  const inventoryItems = useMemo(
    () =>
      inventory
        .map((id) => itemsData.find((item) => item.id === id))
        .filter(Boolean),
    [inventory]
  );

  // --- Memoized unlocked notes ---
  const unlockedNotes = useMemo(
    () =>
      notes
        .filter((n) => n.unlocked)
        .map(
          (n) =>
            notesData.find((note) => note.id === n.id) || {
              id: n.id,
              title: "No title",
              content: ["No content"],
            }
        ),
    [notes]
  );

  return (
    <div className="protagonist-hub">
      {/* Portrait Tab */}
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
            <button onClick={handleQuickSave}>Save</button>
            <button onClick={handleQuickLoad}>Load</button>
            <button onClick={handleExportSave}>Export Save File</button>
            <button onClick={handleImportSave}>Import Save File</button>
          </div>

          {saveMsg && <div style={{ color: "white", marginTop: 6 }}>{saveMsg}</div>}

          {/* Hidden file input */}
          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </>
      )}

      {/* Inventory Tab */}
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

      {/* Notes Tab */}
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
}