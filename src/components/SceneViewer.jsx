import "../styles/SceneViewer.css";
import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";

export default function SceneViewer({ scene }) {
  const nodeMap = Object.fromEntries(
    scene.nodes.filter((n) => n.id).map((n) => [n.id, n])
  );

  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [flags, setFlags] = useState({});
  const [waitingChoice, setWaitingChoice] = useState(false);

  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();

  const currentNode =
    currentNodeIndex !== null ? scene.nodes[currentNodeIndex] : null;

  // --- Helpers ---

  const checkConditions = (node) => {
    if (!node.conditions) return true;
    return Object.entries(node.conditions).every(
      ([flag, value]) => flags[flag] === value
    );
  };

  const findNodeIndexById = (id) =>
    scene.nodes.findIndex((n) => n.id && n.id === id);

  /**
   * Get the "next" node index for a given node.
   * Behavior:
   *  - If node.next exists and matches a known id, return that index.
   *  - If node.next exists but no id matches, FALL BACK to sequential next index.
   *  - If node.next doesn't exist, use sequential next index.
   *  - Important: when falling back to sequential scanning, skip nodes that have `id`
   *    because those are branch anchor nodes (they should only be reached via explicit jump).
   *  - Only return sequential nodes that also pass conditions.
   */
  const getNextNodeIndex = (node, fromIndex = scene.nodes.indexOf(node)) => {
    if (!node) return null;

    // If node.next is provided, prefer it when it matches an id
    if (node.next) {
      const byId = findNodeIndexById(node.next);
      if (byId !== -1 && checkConditions(scene.nodes[byId])) return byId;

      // fallback: treat as "next in sequence" if id not found (but still skip id nodes)
    }

    // Sequential fallback: find the next node AFTER fromIndex that:
    //  - passes its conditions
    //  - does NOT have an `id` (we treat id'd nodes as branch-only anchors)
    for (let i = fromIndex + 1; i < scene.nodes.length; i++) {
      const candidate = scene.nodes[i];
      if (candidate.id) continue; // skip anchor/branch nodes in default sequence
      if (checkConditions(candidate)) return i;
    }
    return null;
  };

  // --- Core logic ---

  const renderNext = () => {
    if (!currentNode || waitingChoice) return;

    let block = currentNode;
    let idx = currentNodeIndex;

    // Skip invalid nodes (conditions): advance until one that does match
    while (block && !checkConditions(block)) {
      idx = getNextNodeIndex(block, idx);
      if (idx === null) {
        setCurrentNodeIndex(null);
        return;
      }
      block = scene.nodes[idx];
      setCurrentNodeIndex(idx);
    }

    if (!block) return;

    // Prevent duplicate rendering: if this node (by reference or id) already exists in renderedBlocks,
    // advance the pointer instead of re-rendering it.
    const alreadyRendered = renderedBlocks.some((b) =>
      b === block || (b.id && block.id && b.id === block.id)
    );
    if (alreadyRendered) {
      const nextIndex = getNextNodeIndex(block, idx);
      setCurrentNodeIndex(nextIndex);
      return;
    }

    // Apply inventory/notes for this block
    block.inventoryAdd?.forEach(addItem);
    block.inventoryRemove?.forEach(removeItem);
    block.notesAdd?.forEach(addNote);

    // Render the block
    setRenderedBlocks((prev) => [...prev, block]);

    // If it's a choice, stop and wait for player input
    if (block.type === "dialogueChoice") {
      setWaitingChoice(true);
      return;
    }

    // Otherwise, advance to the next node (skipping id'd anchors as per getNextNodeIndex)
    const nextIndex = getNextNodeIndex(block, idx);
    setCurrentNodeIndex(nextIndex);
  };

  const handleChoice = (choice) => {
    // Merge choice.effects into flags
    setFlags((prev) => ({ ...prev, ...(choice.effects || {}) }));

    // Represent player's choice as dialogue
    const youBlock = {
      type: "characterDialogue",
      character: { id: "you", name: "You" },
      text: [choice.text],
    };

    // Reaction blocks provided inline in the choice (may be empty)
    const reactionBlocks = choice.reaction || [];

    // Apply side effects from reaction blocks immediately
    reactionBlocks.forEach((block) => {
      block.inventoryAdd?.forEach(addItem);
      block.inventoryRemove?.forEach(removeItem);
      block.notesAdd?.forEach(addNote);
    });

    // Determine the next index:
    // Try choice.next (id); if not found, fall back to the next valid sequential node
    let candidateNextIndex = null;
    if (choice.next) {
      const byId = findNodeIndexById(choice.next);
      candidateNextIndex = byId !== -1 ? byId : getNextNodeIndex(scene.nodes[currentNodeIndex], currentNodeIndex);
    } else {
      candidateNextIndex = getNextNodeIndex(scene.nodes[currentNodeIndex], currentNodeIndex);
    }

    const nextNode = candidateNextIndex !== null ? scene.nodes[candidateNextIndex] : null;

    // If we're injecting the nextNode immediately, apply its side effects now
    if (nextNode) {
      nextNode.inventoryAdd?.forEach(addItem);
      nextNode.inventoryRemove?.forEach(removeItem);
      nextNode.notesAdd?.forEach(addNote);
    }

    // Build immediate insertion list: YOU + reaction(s) + nextNode (if any)
    const immediateBlocks = [youBlock, ...reactionBlocks];
    if (nextNode) immediateBlocks.push(nextNode);

    // Replace the choice block (currentNode) with the immediate blocks
    setRenderedBlocks((prev) => [
      ...prev.filter((b) => b !== currentNode),
      ...immediateBlocks,
    ]);

    // Reset waitingChoice (we may re-enable it below)
    setWaitingChoice(false);

    // Advance pointer so we don't re-render injected nodes:
    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        // If the injected next is itself a choice, keep pointer at that choice and wait
        setWaitingChoice(true);
        setCurrentNodeIndex(candidateNextIndex);
      } else {
        // Otherwise, move pointer to the node after the injected node (skipping id anchors)
        const afterNext = getNextNodeIndex(nextNode, candidateNextIndex);
        setCurrentNodeIndex(afterNext);
      }
    } else {
      // No next -> end scene
      setCurrentNodeIndex(null);
    }
  };

  // Find the last block with a portrait to display
  const lastPortraitBlock = [...renderedBlocks].reverse().find((b) => b.character?.portrait);

  return (
    <div className="scene-viewer">
      {/* Show the most recent speaker’s portrait */}
      {lastPortraitBlock && (
        <div className="scene-viewer-portrait">
          <img
            src={new URL(`../assets/portraits/${lastPortraitBlock.character.portrait}`, import.meta.url).href}
            alt={lastPortraitBlock.character.name}
          />
        </div>
      )}

      {/* Render each block that has been revealed so far */}
      {renderedBlocks.map((block, idx) => {
        const isCurrent = idx === renderedBlocks.length - 1;
        const blockClass = `scene-viewer-block${isCurrent ? " is-current" : ""}`;

        if (block.type === "singleParagraph") {
          return (
            <div key={idx} className={blockClass}>
              <p>{block.text}</p>
            </div>
          );
        }

        if (block.type === "multipleParagraphs") {
          return (
            <div key={idx} className={blockClass}>
              {block.text.map((t, tIdx) => (
                <p key={`${idx}-${tIdx}`}>{t}</p>
              ))}
            </div>
          );
        }

        if (block.type === "characterDialogue") {
          const characterName = block.character?.name?.toUpperCase() || "???";
          const dialogueText = Array.isArray(block.text) ? block.text.join(" ") : block.text;
          return (
            <div key={idx} className={blockClass}>
              <p>
                <strong style={{ textTransform: "uppercase" }}>{characterName} —</strong>{" "}
                {dialogueText}
              </p>
            </div>
          );
        }

        if (block.type === "dialogueChoice") {
          return (
            <div key={idx} className={blockClass}>
              <ol className="scene-viewer-dialogue-list">
                {block.choices.map((choice, cidx) => (
                  <li key={cidx} className="scene-viewer-dialogue-list-option">
                    <button onClick={() => handleChoice(choice)}>{choice.text}</button>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        return null; // Unknown block type
      })}

      {/* Begin/Continue button: only visible if:
            - Not waiting on a choice
            - There is a current node to advance to */}
      {!waitingChoice && currentNodeIndex !== null && (
        <button onClick={renderNext}>
          {renderedBlocks.length === 0 ? "Begin" : "Continue"}
        </button>
      )}
    </div>
  );
}