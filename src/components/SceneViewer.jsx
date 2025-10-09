import "../styles/SceneViewer.css";
import { useState, useEffect, useRef } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";

// --- Import character definitions ---
import characters from "../data/characters.json";

export default function SceneViewer({ scene }) {
  // --- Quick lookup for nodes by ID ---
  const nodeMap = Object.fromEntries(scene.nodes.filter(n => n.id).map(n => [n.id, n]));

  // --- State ---
  const [currentNodeId, setCurrentNodeId] = useState(scene.nodes[0]?.id ?? null);
  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [flags, setFlags] = useState({});
  const [waitingChoice, setWaitingChoice] = useState(false);

  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();

  const currentNode = currentNodeId ? nodeMap[currentNodeId] : null;

  // --- Ref for auto-scroll ---
  const contentRef = useRef(null);

  // --- Helpers ---
  const checkConditions = (node, flagSet = flags) =>
    !node?.conditions || Object.entries(node.conditions).every(([flag, val]) => flagSet[flag] === val);

  // --- Resolve character reference if it's a string ---
  const resolveCharacter = char => {
    if (!char) return null;
    if (typeof char === "string") return characters[char] || { id: char, name: "???", portrait: "" };
    return char;
  };

  // --- Determine next node ID, including conditional nextIf ---
  const getNextNodeId = (fromNode, flagSet = flags) => {
    if (!fromNode) return null;

    // Handle conditional nextIf first
    if (Array.isArray(fromNode.nextIf)) {
      for (const branch of fromNode.nextIf) {
        if (!branch.conditions || Object.entries(branch.conditions).every(([f, val]) => flagSet[f] === val)) {
          if (branch.next && nodeMap[branch.next]) return branch.next;
        }
      }
    }

    // Fallback to default next
    if (fromNode.next && nodeMap[fromNode.next]) {
      const nextNode = nodeMap[fromNode.next];
      // Skip node if conditions not met
      if (!checkConditions(nextNode, flagSet)) return getNextNodeId(nextNode, flagSet);
      return nextNode.id;
    }

    return null;
  };

  // --- Core progression ---
  const renderNext = () => {
    if (!currentNode || waitingChoice) return;

    let node = currentNode;

    // Skip nodes whose conditions aren't satisfied
    while (node && !checkConditions(node)) {
      const nextId = getNextNodeId(node);
      if (!nextId) return setCurrentNodeId(null);
      node = nodeMap[nextId];
    }

    if (!node) return;

    // Avoid re-rendering the same node
    if (renderedBlocks.some(b => b.id && node.id && b.id === node.id)) {
      const nextId = getNextNodeId(node);
      return setCurrentNodeId(nextId);
    }

    // Apply side effects
    node.inventoryAdd?.forEach(addItem);
    node.inventoryRemove?.forEach(removeItem);
    node.notesAdd?.forEach(addNote);

    // Render node
    setRenderedBlocks(prev => [...prev, node]);

    // Stop progression if it's a choice
    if (node.type === "dialogueChoice") return setWaitingChoice(true);

    // Otherwise, go to next node
    setCurrentNodeId(getNextNodeId(node));
  };

  const handleChoice = choice => {
    const mergedFlags = { ...flags, ...(choice.effects || {}) };

    // Player dialogue block
    const youBlock = {
      type: "characterDialogue",
      character: { id: "you", name: "You" },
      text: [choice.text],
    };

    // Optional reaction blocks
    const reactionBlocks = choice.reaction || [];
    reactionBlocks.forEach(b => {
      b.inventoryAdd?.forEach(addItem);
      b.inventoryRemove?.forEach(removeItem);
      b.notesAdd?.forEach(addNote);
    });

    // Determine next node
    const nextId = choice.next || getNextNodeId(currentNode, mergedFlags);
    const nextNode = nextId ? nodeMap[nextId] : null;

    // Apply side effects of next node immediately
    nextNode?.inventoryAdd?.forEach(addItem);
    nextNode?.inventoryRemove?.forEach(removeItem);
    nextNode?.notesAdd?.forEach(addNote);

    // Replace the choice node with "You" + reactions + next node
    const insert = [youBlock, ...reactionBlocks];
    if (nextNode) insert.push(nextNode);

    setRenderedBlocks(prev => [...prev.filter(b => b.id !== currentNode.id), ...insert]);
    setFlags(mergedFlags);
    setWaitingChoice(false);

    // Continue story
    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        setWaitingChoice(true);
        setCurrentNodeId(nextNode.id);
      } else {
        setCurrentNodeId(getNextNodeId(nextNode, mergedFlags));
      }
    } else {
      setCurrentNodeId(null);
    }
  };

  // --- Auto-scroll whenever content grows ---
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [renderedBlocks]);

  // --- Determine portrait to display ---
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

          // --- Single Paragraph ---
          if (block.type === "singleParagraph")
            return (
              <div key={i} className={cls}>
                <p dangerouslySetInnerHTML={{ __html: block.text }} />
              </div>
            );

          // --- Multiple Paragraphs ---
          if (block.type === "multipleParagraphs")
            return (
              <div key={i} className={cls}>
                {block.text.map((t, j) => (
                  <p key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: t }} />
                ))}
              </div>
            );

          // --- Character Dialogue ---
          if (block.type === "characterDialogue") {
            const character = resolveCharacter(block.character);
            const name = character?.name?.toUpperCase() || "???";
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

          // --- Dialogue Choice ---
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