// React and context hooks
import { useState, useMemo, useRef } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";

// UI components
import Options from "./Options";
import Inventory from "./Inventory";
import Notes from "./Notes";
import Exit from "./Exit";

// Data and styles
import itemsData from "../data/items.json";
import notesData from "../data/notes.json";
import "../styles/PlayerMenu.css";

const protagonistImg = "/assets/portraits/protagonist.png";

export default function PlayerMenu({
  onQuickSave,
  onQuickLoad,
  getStorySnapshot,
  onExitToMenu,
}) {
  // UI state for various modal windows
  const [showOptions, setShowOptions] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // State for feedback message and opened note
  const [saveMsg, setSaveMsg] = useState("");
  const [openNoteId, setOpenNoteId] = useState(null);

  // Ref for hidden input element used to import save files
  const fileInputRef = useRef(null);

  // Access context data from gameplay systems
  const { inventory } = useInventory();
  const { notes } = useNotes();
  const { flags } = useFlags();

  // Toggle the open state of a note entry by id
  const toggleNote = (id) => setOpenNoteId((prev) => (prev === id ? null : id));

  // Display short confirmation message
  const flashMsg = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 1500);
  };

  // Trigger quick save via context and show confirmation
  const handleQuickSave = () => {
    if (onQuickSave) {
      onQuickSave();
      flashMsg("Saved!");
      setShowOptions(false);
    }
  };

  // Trigger quick load via context and close options menu afterward
  const handleQuickLoad = () => {
    if (onQuickLoad) {
      onQuickLoad();
      flashMsg("Loaded!");
      setShowOptions(false);
    }
  };

  // Export current game state as a JSON file and close the options window
  const handleExportSave = () => {
    try {
      const storyData =
        typeof getStorySnapshot === "function" ? getStorySnapshot() : null;

      const snapshot = {
        version: 1,
        timestamp: Date.now(),
        story: storyData,
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
      setShowOptions(false);
    } catch (err) {
      console.error("Export failed:", err);
      flashMsg("Export failed");
    }
  };

  // Trigger hidden file input to import save data
  const handleImportSave = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Read and validate an imported save file, then load it into localStorage
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate basic save structure before applying
      if (!data || typeof data !== "object" || !data.version) {
        console.warn("Invalid save file");
        flashMsg("Invalid File");
        return;
      }

      localStorage.setItem("paperbacks_quick_save", JSON.stringify(data));

      if (onQuickLoad) onQuickLoad();
      flashMsg("Imported ✓");
      setShowOptions(false);
    } catch (err) {
      console.error("Import failed:", err);
      flashMsg("Import failed");
    } finally {
      e.target.value = ""; // Reset input so same file can be re-imported
    }
  };

  // Build inventory items from current IDs
  const inventoryItems = useMemo(
    () =>
      inventory
        .map((id) => itemsData.find((item) => item.id === id))
        .filter(Boolean),
    [inventory]
  );

  // Build unlocked notes with fallback content
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

  // Render player menu and subwindows
  return (
    <>
      {/* Display main player menu */}
      <div className="player-menu">
        {/* Show feedback message for quick actions */}
        {saveMsg && <span className="player-menu-toast">{saveMsg}</span>}

        {/* Wrap portrait and buttons */}
        <div className="player-menu-window pixelated-corners">
          {/* Show player portrait */}
          <div className="player-menu-portrait">
            <img
              src={protagonistImg}
              alt="Protagonist Portrait"
              className="player-menu-portrait-image"
            />
          </div>

          {/* Render main action buttons */}
          <div className="player-menu-buttons">
            <button
              onClick={() => setShowInventory(true)}
              className="player-menu-buttons-item player-menu-buttons-item-inventory"
            >
              Inventory
            </button>
            <button
              onClick={() => setShowNotes(true)}
              className="player-menu-buttons-item player-menu-buttons-item-notes"
            >
              Notes
            </button>
            <button
              onClick={() => setShowOptions(true)}
              className="player-menu-buttons-item player-menu-buttons-item-options"
            >
              Options
            </button>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="player-menu-buttons-item player-menu-buttons-item-exit"
            >
              Exit
            </button>
          </div>

          {/* Hidden input for importing save files */}
          <input
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Show options window */}
      {showOptions && (
        <Options
          onClose={() => setShowOptions(false)}
          onSave={handleQuickSave}
          onLoad={handleQuickLoad}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
        />
      )}

      {/* Show inventory window */}
      {showInventory && (
        <Inventory
          items={inventoryItems}
          onClose={() => setShowInventory(false)}
        />
      )}

      {/* Show notes window */}
      {showNotes && (
        <Notes
          notes={unlockedNotes}
          openNoteId={openNoteId}
          onToggleNote={toggleNote}
          onClose={() => setShowNotes(false)}
        />
      )}

      {/* Show exit confirmation window */}
      {showExitConfirm && (
        <Exit
          onConfirm={onExitToMenu}
          onClose={() => setShowExitConfirm(false)}
        />
      )}
    </>
  );
}