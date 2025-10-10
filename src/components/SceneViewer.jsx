import "../styles/SceneViewer.css";
import { useState, useEffect, useRef } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import { useFlags } from "../context/FlagsContext";
import characters from "../data/characters.json";

export default function SceneViewer({ scene, onNodeChange }) {
  // --- Lookup table for nodes ---
  const nodeMap = Object.fromEntries(scene.nodes.filter(n => n.id).map(n => [n.id, n]));

  // --- Core state ---
  const [currentNodeId, setCurrentNodeId] = useState(scene.nodes[0]?.id ?? null);
  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [waitingChoice, setWaitingChoice] = useState(false);
  const contentRef = useRef(null);

  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();
  const { flags, setFlag } = useFlags();

  const currentNode = currentNodeId ? nodeMap[currentNodeId] : null;
  const MAX_RENDERED_BLOCKS = 10; // limit visible history

  // --- Notify parent on node change ---
  useEffect(() => {
    if (onNodeChange && currentNodeId) onNodeChange(currentNodeId);
  }, [currentNodeId, onNodeChange]);

  // --- Check if node meets flag conditions ---
  const checkConditions = (node, flagSet = flags) =>
    !node?.conditions || Object.entries(node.conditions).every(([f, v]) => flagSet[f] === v);

  // --- Resolve character data ---
  const resolveCharacter = char =>
    typeof char === "string" ? characters[char] || { id: char, name: "???", portrait: "" } : char;

  // --- Find next node (handles conditionals) ---
  const getNextNodeId = (fromNode, flagSet = flags) => {
    if (!fromNode) return null;

    if (Array.isArray(fromNode.nextIf)) {
      for (const branch of fromNode.nextIf) {
        if (!branch.conditions || Object.entries(branch.conditions).every(([f, v]) => flagSet[f] === v))
          if (branch.next && nodeMap[branch.next]) return branch.next;
      }
    }

    if (fromNode.next && nodeMap[fromNode.next]) {
      const nextNode = nodeMap[fromNode.next];
      if (!checkConditions(nextNode, flagSet)) return getNextNodeId(nextNode, flagSet);
      return nextNode.id;
    }

    return null;
  };

  // --- Progress story forward ---
  const renderNext = () => {
    if (!currentNode || waitingChoice) return;
    let node = currentNode;

    // Skip unmet conditions
    while (node && !checkConditions(node)) {
      const nextId = getNextNodeId(node);
      if (!nextId) return setCurrentNodeId(null);
      node = nodeMap[nextId];
    }
    if (!node) return;

    // Skip duplicates
    if (renderedBlocks.some(b => b.id && node.id && b.id === node.id)) {
      const nextId = getNextNodeId(node);
      return setCurrentNodeId(nextId);
    }

    // Apply effects
    node.inventoryAdd?.forEach(addItem);
    node.inventoryRemove?.forEach(removeItem);
    node.notesAdd?.forEach(addNote);
    if (node.effects) Object.entries(node.effects).forEach(([f, v]) => setFlag(f, v));

    // Append to visible log (trim older)
    setRenderedBlocks(prev => [...prev.slice(-MAX_RENDERED_BLOCKS + 1), node]);

    // Stop at choice
    if (node.type === "dialogueChoice") return setWaitingChoice(true);

    // Continue
    setCurrentNodeId(getNextNodeId(node));
  };

  // --- Handle player choice ---
  const handleChoice = choice => {
    const mergedFlags = { ...flags, ...(choice.effects || {}) };
    if (choice.effects) Object.entries(choice.effects).forEach(([f, v]) => setFlag(f, v));

    const youBlock = { type: "characterDialogue", character: { id: "you", name: "You" }, text: [choice.text] };
    const reactionBlocks = choice.reaction || [];

    // Apply effects for reactions
    reactionBlocks.forEach(b => {
      b.inventoryAdd?.forEach(addItem);
      b.inventoryRemove?.forEach(removeItem);
      b.notesAdd?.forEach(addNote);
      if (b.effects) Object.entries(b.effects).forEach(([f, v]) => setFlag(f, v));
    });

    const nextId = choice.next || getNextNodeId(currentNode, mergedFlags);
    const nextNode = nextId ? nodeMap[nextId] : null;

    // Pre-apply effects of next node
    nextNode?.inventoryAdd?.forEach(addItem);
    nextNode?.inventoryRemove?.forEach(removeItem);
    nextNode?.notesAdd?.forEach(addNote);
    if (nextNode?.effects) Object.entries(nextNode.effects).forEach(([f, v]) => setFlag(f, v));

    const insert = [youBlock, ...reactionBlocks];
    if (nextNode) insert.push(nextNode);

    // Replace choice node and trim log
    setRenderedBlocks(prev => [
      ...prev.filter(b => b.id !== currentNode.id).slice(-MAX_RENDERED_BLOCKS + insert.length),
      ...insert,
    ]);

    setWaitingChoice(false);

    // Continue story
    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        setWaitingChoice(true);
        setCurrentNodeId(nextNode.id);
      } else setCurrentNodeId(getNextNodeId(nextNode, mergedFlags));
    } else setCurrentNodeId(null);
  };

  // --- Auto-scroll when new block added ---
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [renderedBlocks]);

  // --- Pick most recent portrait block ---
  const lastPortraitBlock = [...renderedBlocks].reverse().find(b => resolveCharacter(b.character)?.portrait);

  // --- Render ---
  return (
    <div className="scene-viewer">
      {lastPortraitBlock && (
        <div className="scene-viewer-portrait">
          <img
            src={`/assets/portraits/${resolveCharacter(lastPortraitBlock.character).portrait}`}
            alt={resolveCharacter(lastPortraitBlock.character).name}
          />
        </div>
      )}

      <div className="scene-viewer-content" ref={contentRef}>
        {renderedBlocks.map((block, i) => {
          const isCurrent = i === renderedBlocks.length - 1;
          const cls = `scene-viewer-node${isCurrent ? " is-current" : ""}`;

          if (block.type === "singleParagraph")
            return (
              <div key={i} className={cls}>
                <p dangerouslySetInnerHTML={{ __html: block.text }} />
              </div>
            );

          if (block.type === "multipleParagraphs")
            return (
              <div key={i} className={cls}>
                {block.text.map((t, j) => (
                  <p key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: t }} />
                ))}
              </div>
            );

          if (block.type === "characterDialogue") {
            const char = resolveCharacter(block.character);
            const name = char?.name?.toUpperCase() || "???";
            const text = Array.isArray(block.text) ? block.text.join(" ") : block.text;

            return (
              <div key={i} className={cls}>
                <p>
                  <strong style={{ textTransform: "uppercase" }}>{name} —</strong>{" "}
                  <span dangerouslySetInnerHTML={{ __html: text }} />
                </p>
              </div>
            );
          }

          if (block.type === "dialogueChoice")
            return (
              <div key={i} className={cls}>
                <ol className="scene-viewer-dialogue-list">
                  {block.choices.map((c, j) => (
                    <li key={j} className="scene-viewer-dialogue-list-option">
                      <button onClick={() => handleChoice(c)}>{c.text}</button>
                    </li>
                  ))}
                </ol>
              </div>
            );

          return null;
        })}

        {!waitingChoice && currentNodeId !== null && (
          <button onClick={renderNext} className="scene-viewer-button">
            {renderedBlocks.length === 0 ? "Begin" : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
}