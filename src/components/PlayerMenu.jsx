import { useState, useMemo, useRef } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import { useFlags } from "../context/FlagsContext";
import Options from "./Options"; // window for save/load/export/import
import Inventory from "./Inventory"; // inventory window
import Notes from "./Notes"; // notes window
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";
import "../styles/PlayerMenu.css";

const protagonistImg = "/assets/portraits/protagonist.png";

export default function PlayerMenu({ onQuickSave, onQuickLoad, getSceneSnapshot }) {
  const [saveMsg, setSaveMsg] = useState(""); // feedback message
  const [showOptions, setShowOptions] = useState(false); // controls Options window
  const [showInventory, setShowInventory] = useState(false); // controls Inventory window
  const [showNotes, setShowNotes] = useState(false); // controls Notes window
  const [openNoteId, setOpenNoteId] = useState(null); // expanded note
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
      setShowOptions(false); // close window after load
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
      setShowOptions(false); // close window after import
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
    <div className="player-menu">
      <div className="player-menu-portrait">
        <img
          src={protagonistImg}
          alt="Protagonist Portrait"
          className="player-menu-portrait-image"
        />
      </div>

      <div className="player-menu-buttons">
        <button onClick={() => setShowInventory(true)}>Inventory</button>
        <button onClick={() => setShowNotes(true)}>Notes</button>
        <button onClick={() => setShowOptions(true)}>Options</button>
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

      {/* Windows */}
      {showOptions && (
        <Options
          onClose={() => setShowOptions(false)}
          onSave={handleQuickSave}
          onLoad={handleQuickLoad}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
        />
      )}

      {showInventory && (
        <Inventory
          items={inventoryItems}
          onClose={() => setShowInventory(false)}
        />
      )}

      {showNotes && (
        <Notes
          notes={unlockedNotes}
          openNoteId={openNoteId}
          onToggleNote={toggleNote}
          onClose={() => setShowNotes(false)}
        />
      )}
    </div>
  );
}