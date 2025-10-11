// --- React & context ---
import { useState, useMemo, useRef } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import { useFlags } from "../context/FlagsContext";

// --- Components ---
import Options from "./Options";
import Inventory from "./Inventory";
import Notes from "./Notes";
import Exit from "./Exit"; // ✅ new import
import WindowOverlay from "./WindowOverlay"; // still used by subwindows

// --- Data & styles ---
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";
import "../styles/PlayerMenu.css";

const protagonistImg = "/assets/portraits/protagonist.png";

export default function PlayerMenu({
  onQuickSave,
  onQuickLoad,
  getSceneSnapshot,
  onExitToMenu,
}) {
  const [saveMsg, setSaveMsg] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false); // ✅ Exit modal
  const [openNoteId, setOpenNoteId] = useState(null);
  const fileInputRef = useRef(null);

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
      setShowOptions(false);
    }
  };

  // --- Export save file ---
  const handleExportSave = () => {
    try {
      const sceneData =
        typeof getSceneSnapshot === "function" ? getSceneSnapshot() : null;

      const snapshot = {
        version: 1,
        timestamp: Date.now(),
        scene: sceneData,
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

  // --- Import save file ---
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

      localStorage.setItem("paperbacks_quick_save", JSON.stringify(data));

      if (onQuickLoad) onQuickLoad();
      flashMsg("Imported ✓");
      setShowOptions(false);
    } catch (err) {
      console.error("❌ Import failed:", err);
      flashMsg("Import failed ❌");
    } finally {
      e.target.value = "";
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

  // --- Render ---
  return (
    <div className="player-menu">
      {/* Portrait */}
      <div className="player-menu-portrait">
        <img
          src={protagonistImg}
          alt="Protagonist Portrait"
          className="player-menu-portrait-image"
        />
      </div>

      {/* Buttons */}
      <div className="player-menu-buttons">
        <button
          onClick={() => setShowInventory(true)}
          className="player-menu-buttons-item"
        >
          Inventory
        </button>
        <button
          onClick={() => setShowNotes(true)}
          className="player-menu-buttons-item"
        >
          Notes
        </button>
        <button
          onClick={() => setShowOptions(true)}
          className="player-menu-buttons-item"
        >
          Options
        </button>
        <button
          onClick={() => setShowExitConfirm(true)}
          className="player-menu-buttons-item player-menu-buttons-exit"
        >
          Exit
        </button>
      </div>

      {/* Feedback message */}
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

      {/* ✅ Exit window */}
      {showExitConfirm && (
        <Exit
          onConfirm={onExitToMenu}
          onClose={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
}