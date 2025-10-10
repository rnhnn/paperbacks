import "../styles/SceneViewer.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import { useFlags } from "../context/FlagsContext";
import characters from "../data/characters.json";

export default function SceneViewer({ scene, savedScene, onSceneSnapshot }) {
  // --- Stable lookup table for nodes ---
  const nodeMap = useMemo(
    () =>
      Object.fromEntries(scene.nodes.filter((n) => n.id).map((n) => [n.id, n])),
    [scene.nodes]
  );

  // --- Core state ---
  const [currentNodeId, setCurrentNodeId] = useState(
    savedScene?.currentNodeId ?? scene.nodes[0]?.id ?? null
  );
  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [waitingChoice, setWaitingChoice] = useState(false);
  const contentRef = useRef(null);

  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();
  const { flags, setFlag } = useFlags();

  const currentNode = currentNodeId ? nodeMap[currentNodeId] : null;
  const MAX_RENDERED_BLOCKS = 10;

  // --- Rehydrate on Quick Load ---
  useEffect(() => {
    if (!savedScene) return;

    console.log("🔁 Restoring scene from saved state:", savedScene);
    const startId = savedScene.currentNodeId ?? scene.nodes[0]?.id ?? null;
    setCurrentNodeId(startId);

    const recent = (savedScene.recentNodeIds || [])
      .map((id) => nodeMap[id])
      .filter(Boolean);

    setRenderedBlocks(recent.slice(-MAX_RENDERED_BLOCKS));

    // if the restored node is a dialogueChoice, resume in waiting state
    const startNode = startId ? nodeMap[startId] : null;
    setWaitingChoice(startNode?.type === "dialogueChoice");
  }, [savedScene, nodeMap, scene.nodes]);

  // --- Helpers ---
  const checkConditions = (node, flagSet = flags) =>
    !node?.conditions ||
    Object.entries(node.conditions).every(([f, v]) => flagSet[f] === v);

  const resolveCharacter = (char) =>
    typeof char === "string"
      ? characters[char] || { id: char, name: "???", portrait: "" }
      : char;

  const getNextNodeId = (fromNode, flagSet = flags) => {
    if (!fromNode) return null;

    if (Array.isArray(fromNode.nextIf)) {
      for (const branch of fromNode.nextIf) {
        const pass =
          !branch.conditions ||
          Object.entries(branch.conditions).every(([f, v]) => flagSet[f] === v);
        if (pass && branch.next && nodeMap[branch.next]) return branch.next;
      }
    }

    if (fromNode.next && nodeMap[fromNode.next]) {
      const nextNode = nodeMap[fromNode.next];
      if (!checkConditions(nextNode, flagSet))
        return getNextNodeId(nextNode, flagSet);
      return nextNode.id;
    }

    return null;
  };

  const applyEffects = (nodeLike) => {
    if (!nodeLike) return;
    nodeLike.inventoryAdd?.forEach(addItem);
    nodeLike.inventoryRemove?.forEach(removeItem);
    nodeLike.notesAdd?.forEach(addNote);
    if (nodeLike.effects)
      Object.entries(nodeLike.effects).forEach(([f, v]) => setFlag(f, v));
  };

  // --- Manual snapshot builder (for Quick Save) ---
  const getSceneSnapshot = () => ({
    currentNodeId,
    recentNodeIds: renderedBlocks
      .map((b) => b.id || b.type)
      .slice(-MAX_RENDERED_BLOCKS),
  });

  // Provide snapshot getter to parent (only when function reference changes)
  useEffect(() => {
    if (onSceneSnapshot) onSceneSnapshot(getSceneSnapshot);
  }, [onSceneSnapshot, currentNodeId, renderedBlocks]);

  // --- Progress story ---
  const renderNext = () => {
    if (!currentNode || waitingChoice) return;
    let node = currentNode;

    while (node && !checkConditions(node)) {
      const nextId = getNextNodeId(node);
      if (!nextId) return setCurrentNodeId(null);
      node = nodeMap[nextId];
    }
    if (!node) return;

    if (renderedBlocks.some((b) => b.id && node.id && b.id === node.id)) {
      const nextId = getNextNodeId(node);
      return setCurrentNodeId(nextId);
    }

    applyEffects(node);
    setRenderedBlocks((prev) => [
      ...prev.slice(-MAX_RENDERED_BLOCKS + 1),
      node,
    ]);

    if (node.type === "dialogueChoice") return setWaitingChoice(true);

    setCurrentNodeId(getNextNodeId(node));
  };

  // --- Handle choice ---
  const handleChoice = (choice) => {
    const mergedFlags = { ...flags, ...(choice.effects || {}) };
    if (choice.effects)
      Object.entries(choice.effects).forEach(([f, v]) => setFlag(f, v));

    const youBlock = {
      type: "characterDialogue",
      character: { id: "you", name: "You" },
      text: [choice.text],
    };
    const reactionBlocks = choice.reaction || [];
    reactionBlocks.forEach(applyEffects);

    const nextId = choice.next || getNextNodeId(currentNode, mergedFlags);
    const nextNode = nextId ? nodeMap[nextId] : null;

    applyEffects(nextNode);

    const insert = [youBlock, ...reactionBlocks];
    if (nextNode) insert.push(nextNode);

    setRenderedBlocks((prev) => [
      ...prev
        .filter((b) => b.id !== currentNode.id)
        .slice(-MAX_RENDERED_BLOCKS + insert.length),
      ...insert,
    ]);

    setWaitingChoice(false);

    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        setWaitingChoice(true);
        setCurrentNodeId(nextNode.id);
      } else setCurrentNodeId(getNextNodeId(nextNode, mergedFlags));
    } else setCurrentNodeId(null);
  };

  // --- Auto-scroll ---
  useEffect(() => {
    if (contentRef.current)
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [renderedBlocks]);

  // --- Portrait ---
  const lastPortraitBlock = [...renderedBlocks]
    .reverse()
    .find((b) => resolveCharacter(b.character)?.portrait);

  // --- Render ---
  return (
    <div className="scene-viewer">
      {lastPortraitBlock && (
        <div className="scene-viewer-portrait">
          <img
            src={`/assets/portraits/${resolveCharacter(
              lastPortraitBlock.character
            ).portrait}`}
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
            const text = Array.isArray(block.text)
              ? block.text.join(" ")
              : block.text;

            return (
              <div key={i} className={cls}>
                <p>
                  <strong style={{ textTransform: "uppercase" }}>
                    {name} —
                  </strong>{" "}
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