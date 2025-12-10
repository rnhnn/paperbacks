// Display the in-game player menu with inventory, notes, options, exit, and save management tools

// Styles
import "../styles/PlayerMenu.css";

// React
import { useState, useMemo, useRef, useEffect } from "react";

// Contexts
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";

// Components
import Options from "./Options";
import Inventory from "./Inventory";
import Notes from "./Notes";
import Exit from "./Exit";

// Hooks
import useText from "../hooks/useText";

// Helpers
import { playClickSound } from "../helpers/uiSound";

// Data
import notesData from "../data/notes.json";
import itemsData from "../data/items.json"; // Base item data to detect starting items

const protagonistImg = "/portraits/protagonist.png";

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

  // State for feedback message
  const [saveMsg, setSaveMsg] = useState("");

  // Track fade-in activation on mount
  const [isActive, setIsActive] = useState(false);

  // Ref for hidden input element used to import save files
  const fileInputRef = useRef(null);

  // Access gameplay systems
  const { items, inventory, markItemSeen } = useInventory();
  const { notes, unlockedNotes: unlockedNoteIds, markNoteRead } = useNotes();
  const { flags } = useFlags();

  // Load translation utility
  const { t } = useText();

  // Activate fade-in on mount (bulletproof against Safari paint issues)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsActive(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Display short confirmation message
  const flashMsg = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 1500);
  };

  // Handle quick save and show toast
  const handleQuickSave = () => {
    if (onQuickSave) {
      onQuickSave();
      flashMsg(t("ui.playerMenu.toast.saved"));
      setShowOptions(false);
    }
  };

  // Handle quick load and show toast
  const handleQuickLoad = () => {
    if (onQuickLoad) {
      onQuickLoad();
      flashMsg(t("ui.playerMenu.toast.loaded"));
      setShowOptions(false);
    }
  };

  // Export current game state to a JSON file
  const handleExportSave = () => {
    try {
      const storyData =
        typeof getStorySnapshot === "function" ? getStorySnapshot() : null;

      const snapshot = {
        version: 1,
        timestamp: Date.now(),
        story: storyData,
        inventoryIds: [...inventory], // Use derived list from InventoryContext
        noteIds: [...unlockedNoteIds], // Use derived list from NotesContext
        flags: { ...flags },

        // Persist which acquired items have been seen
        seenItemIds: items
          .filter((i) => i.seen)
          .map((i) => i.id),

        // Persist which unlocked notes have been read
        readNoteIds: notes
          .filter((n) => n.read)
          .map((n) => n.id),
      };

      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `paperbacks-save-${timestamp}.json`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      flashMsg(t("ui.playerMenu.toast.exported"));
      setShowOptions(false);
    } catch (err) {
      console.error("Export failed:", err);
      flashMsg(t("ui.playerMenu.toast.exportFailed"));
    }
  };

  // Trigger hidden input to import save data
  const handleImportSave = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Read and validate an imported save file
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate basic save structure
      if (!data || typeof data !== "object" || !data.version) {
        console.warn("Invalid save file");
        flashMsg(t("ui.playerMenu.toast.invalidFile"));
        return;
      }

      localStorage.setItem("paperbacks_quick_save", JSON.stringify(data));

      if (onQuickLoad) onQuickLoad();
      flashMsg(t("ui.playerMenu.toast.imported"));
      setShowOptions(false);
    } catch (err) {
      console.error("Import failed:", err);
      flashMsg(t("ui.playerMenu.toast.importFailed"));
    } finally {
      e.target.value = ""; // Reset input so same file can be re-imported
    }
  };

  // Build unlocked notes with fallback content for the Notes window
  const menuNotes = useMemo(
    () =>
      notes
        .filter((n) => n.unlocked)
        .map(
          (n) =>
            notesData.find((note) => note.id === n.id) || {
              id: n.id,
              title: t("ui.playerMenu.noTitle"),
              content: [t("ui.playerMenu.noContent")],
            }
        ),
    [notes, t]
  );

  // Build sets of "starting" items/notes based on static data
  const initialAcquiredItemIds = useMemo(
    () =>
      new Set(
        itemsData
          .filter((it) => it.acquired)
          .map((it) => it.id)
      ),
    []
  );

  const initialUnlockedNoteIds = useMemo(
    () =>
      new Set(
        notesData
          .filter((n) => n.unlocked)
          .map((n) => n.id)
      ),
    []
  );

  // Detect whether the player has any notes unlocked
  const hasAnyUnlockedNotes = menuNotes.length > 0;

  // Detect whether there are any unlocked notes that have not been read,
  // ignoring those that start unlocked in notes.json
  const hasUnreadNotes = notes.some(
    (n) => n.unlocked && !n.read && !initialUnlockedNoteIds.has(n.id)
  );

  // Detect whether the player has any items acquired
  const hasAnyAcquiredItems = inventory.length > 0;

  // Detect whether there are any acquired items that have not been seen,
  // ignoring those that start acquired in items.json
  const hasUnseenItems = items.some(
    (i) => i.acquired && !i.seen && !initialAcquiredItemIds.has(i.id)
  );

  // Render player menu and subwindows
  return (
    <>
      {/* Display main player menu */}
      <div className={`player-menu ${isActive ? "is-active" : ""}`}>
        {/* Show feedback message for quick actions */}
        {saveMsg && <span className="player-menu-toast">{saveMsg}</span>}

        {/* Wrap portrait and buttons */}
        <div className="player-menu-window">
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
              onClick={() => {
                if (!hasAnyAcquiredItems) return;
                playClickSound();
                setShowInventory(true);
              }}
              disabled={!hasAnyAcquiredItems}
              className={
                "player-menu-buttons-item player-menu-buttons-item-inventory" +
                (hasUnseenItems ? " player-menu-buttons-item-has-unseen" : "") +
                (!hasAnyAcquiredItems ? " is-disabled" : "")
              }
            >
              {t("ui.playerMenu.buttons.inventory")}
            </button>
            <button
              onClick={() => {
                if (!hasAnyUnlockedNotes) return;
                playClickSound("click-paper");
                setShowNotes(true);
              }}
              disabled={!hasAnyUnlockedNotes}
              className={
                "player-menu-buttons-item player-menu-buttons-item-notes" +
                (hasUnreadNotes ? " player-menu-buttons-item-has-unread" : "") +
                (!hasAnyUnlockedNotes ? " is-disabled" : "")
              }
            >
              {t("ui.playerMenu.buttons.notes")}
            </button>
            <button
              onClick={() => {
                playClickSound();
                setShowOptions(true);
              }}
              className="player-menu-buttons-item player-menu-buttons-item-options"
            >
              {t("ui.playerMenu.buttons.options")}
            </button>
            <button
              onClick={() => {
                playClickSound();
                setShowExitConfirm(true);
              }}
              className="player-menu-buttons-item player-menu-buttons-item-exit"
            >
              {t("ui.playerMenu.buttons.exit")}
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
          items={items}
          onClose={() => setShowInventory(false)}
          onItemSeen={markItemSeen}
        />
      )}

      {/* Show notes window */}
      {showNotes && (
        <Notes
          notes={menuNotes}
          onClose={() => setShowNotes(false)}
          onNoteRead={markNoteRead}
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