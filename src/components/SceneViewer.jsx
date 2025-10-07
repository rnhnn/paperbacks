import "../styles/SceneViewer.css";
import { useState, useEffect, useRef } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";

export default function SceneViewer({ scene }) {
  // Map nodes by ID for quick lookup (only nodes with explicit id)
  const nodeMap = Object.fromEntries(scene.nodes.filter(n => n.id).map(n => [n.id, n]));

  // --- State ---
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [flags, setFlags] = useState({});
  const [waitingChoice, setWaitingChoice] = useState(false);

  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();

  const currentNode = currentNodeIndex !== null ? scene.nodes[currentNodeIndex] : null;

  // --- Ref for scrolling ---
  const contentRef = useRef(null);

  // --- Helpers ---
  const checkConditions = (node, flagSet = flags) =>
    !node.conditions || Object.entries(node.conditions).every(([flag, val]) => flagSet[flag] === val);

  const findNodeIndexById = id => scene.nodes.findIndex(n => n.id === id);

  const getNextNodeIndex = (fromNode, fromIndex = scene.nodes.indexOf(fromNode), flagSet = flags) => {
    if (!fromNode) return null;

    // Prefer explicit "next" ID
    if (fromNode.next) {
      const byId = findNodeIndexById(fromNode.next);
      if (byId !== -1 && checkConditions(scene.nodes[byId], flagSet)) return byId;
    }

    // Sequential fallback: skip id anchors
    for (let i = fromIndex + 1; i < scene.nodes.length; i++) {
      const n = scene.nodes[i];
      if (n.id) continue;
      if (checkConditions(n, flagSet)) return i;
    }

    return null;
  };

  // --- Core progression ---
  const renderNext = () => {
    if (!currentNode || waitingChoice) return;

    let node = currentNode;
    let idx = currentNodeIndex;

    // Skip nodes whose conditions aren't satisfied
    while (node && !checkConditions(node)) {
      idx = getNextNodeIndex(node, idx);
      if (idx === null) return setCurrentNodeIndex(null);
      node = scene.nodes[idx];
      setCurrentNodeIndex(idx);
    }
    if (!node) return;

    // Skip already rendered nodes
    if (renderedBlocks.some(b => b === node || (b.id && node.id && b.id === node.id))) {
      return setCurrentNodeIndex(getNextNodeIndex(node, idx));
    }

    // Apply inventory/notes
    node.inventoryAdd?.forEach(addItem);
    node.inventoryRemove?.forEach(removeItem);
    node.notesAdd?.forEach(addNote);

    setRenderedBlocks(prev => [...prev, node]);

    if (node.type === "dialogueChoice") return setWaitingChoice(true);

    setCurrentNodeIndex(getNextNodeIndex(node, idx));
  };

  const handleChoice = choice => {
    // Merge flags immediately for local next-node evaluation
    const mergedFlags = { ...flags, ...(choice.effects || {}) };

    // Player's dialogue block
    const youBlock = { type: "characterDialogue", character: { id: "you", name: "You" }, text: [choice.text] };

    // Optional reaction blocks
    const reactionBlocks = choice.reaction || [];
    reactionBlocks.forEach(b => {
      b.inventoryAdd?.forEach(addItem);
      b.inventoryRemove?.forEach(removeItem);
      b.notesAdd?.forEach(addNote);
    });

    // Determine next node index
    const choiceIdx = choice.next ? findNodeIndexById(choice.next) : -1;
    const nextIdx = choiceIdx !== -1 ? choiceIdx : getNextNodeIndex(scene.nodes[currentNodeIndex], currentNodeIndex, mergedFlags);
    const nextNode = nextIdx !== null ? scene.nodes[nextIdx] : null;

    // Apply side effects of next node immediately
    nextNode?.inventoryAdd?.forEach(addItem);
    nextNode?.inventoryRemove?.forEach(removeItem);
    nextNode?.notesAdd?.forEach(addNote);

    // Replace choice node with: you + reactions + next node (if any)
    const insert = [youBlock, ...reactionBlocks];
    if (nextNode) insert.push(nextNode);

    setRenderedBlocks(prev => [...prev.filter(b => b !== currentNode), ...insert]);
    setFlags(mergedFlags);
    setWaitingChoice(false);

    // Advance pointer
    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        setWaitingChoice(true);
        setCurrentNodeIndex(nextIdx);
      } else {
        setCurrentNodeIndex(getNextNodeIndex(nextNode, nextIdx, mergedFlags));
      }
    } else {
      setCurrentNodeIndex(null); // scene ends
    }
  };

  // --- Auto-scroll effect ---
  useEffect(() => {
    // Scrolls to bottom whenever renderedBlocks change
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [renderedBlocks]);

  // --- Rendering ---
  const lastPortraitBlock = [...renderedBlocks].reverse().find(b => b.character?.portrait);

  return (
    <div className="scene-viewer">
      <div className="scene-viewer-content" ref={contentRef}>
        {lastPortraitBlock && (
          <div className="scene-viewer-portrait">
            <img
              src={new URL(`../assets/portraits/${lastPortraitBlock.character.portrait}`, import.meta.url).href}
              alt={lastPortraitBlock.character.name}
            />
          </div>
        )}

        {renderedBlocks.map((block, i) => {
          const isCurrent = i === renderedBlocks.length - 1;
          const cls = `scene-viewer-node${isCurrent ? " is-current" : ""}`;

          if (block.type === "singleParagraph") return <div key={i} className={cls}><p>{block.text}</p></div>;
          if (block.type === "multipleParagraphs") return <div key={i} className={cls}>{block.text.map((t,j) => <p key={`${i}-${j}`}>{t}</p>)}</div>;
          if (block.type === "characterDialogue") {
            const name = block.character?.name?.toUpperCase() || "???";
            const text = Array.isArray(block.text) ? block.text.join(" ") : block.text;
            return <div key={i} className={cls}><p><strong style={{textTransform:"uppercase"}}>{name} —</strong> {text}</p></div>;
          }
          if (block.type === "dialogueChoice") return (
            <div key={i} className={cls}>
              <ol className="scene-viewer-dialogue-list">
                {block.choices.map((c,j) => <li key={j} className="scene-viewer-dialogue-list-option"><button onClick={() => handleChoice(c)}>{c.text}</button></li>)}
              </ol>
            </div>
          );
          return null;
        })}

        {!waitingChoice && currentNodeIndex !== null && (
          <button onClick={renderNext} className="scene-viewer-button">{renderedBlocks.length === 0 ? "Begin" : "Continue"}</button>
        )}
      </div>
    </div>
  );
}
