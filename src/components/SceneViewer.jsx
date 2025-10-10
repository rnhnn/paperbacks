// --- Styles & React ---
import "../styles/SceneViewer.css";
import { useState, useEffect, useRef, useMemo } from "react";

// --- Context ---
import { useInventory } from "../context/InventoryContext";
import { useNotes } from "../context/NotesContext";
import { useFlags } from "../context/FlagsContext";
import characters from "../data/characters.json";

export default function SceneViewer({ scene, savedScene, onSceneSnapshot }) {
  // --- Build lookup table for nodes ---
  const nodeMap = useMemo(
    () =>
      Object.fromEntries(scene.nodes.filter((n) => n.id).map((n) => [n.id, n])),
    [scene.nodes]
  );

  // --- Core state ---
  const [currentNodeId, setCurrentNodeId] = useState(
    savedScene?.currentNodeId ?? scene.nodes[0]?.id ?? null // id of node currently on screen
  );
  const [renderedBlocks, setRenderedBlocks] = useState([]); // blocks already shown
  const [waitingChoice, setWaitingChoice] = useState(false); // true when showing a choice list
  const contentRef = useRef(null); // scroll container

  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();
  const { flags, setFlag } = useFlags();

  const currentNode = currentNodeId ? nodeMap[currentNodeId] : null;
  const MAX_RENDERED_BLOCKS = 10;

  // --- Rehydrate on load (keep currentNodeId = visible node) ---
  useEffect(() => {
    if (!savedScene) return;

    console.log("🔁 Restoring scene from saved state:", savedScene);
    const startId = savedScene.currentNodeId ?? scene.nodes[0]?.id ?? null;
    const startNode = startId ? nodeMap[startId] : null;

    const recent = (savedScene.recentNodeIds || [])
      .map((id) => nodeMap[id])
      .filter(Boolean);

    setRenderedBlocks(recent.slice(-MAX_RENDERED_BLOCKS));
    setCurrentNodeId(startId);
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

  // --- Build save snapshot (current node + recent history) ---
  const getSceneSnapshot = () => ({
    currentNodeId,
    recentNodeIds: renderedBlocks
      .map((b) => b.id || b.type)
      .slice(-MAX_RENDERED_BLOCKS),
  });

  // --- Provide snapshot getter to parent ---
  useEffect(() => {
    if (onSceneSnapshot) onSceneSnapshot(getSceneSnapshot);
  }, [onSceneSnapshot, currentNodeId, renderedBlocks]);

  // --- Progress story (render current if unseen; otherwise move to and render next) ---
  const renderNext = () => {
    if (!currentNode || waitingChoice) return;

    // Resolve to a renderable node that meets conditions
    const resolveRenderable = (start) => {
      let node = start;
      while (node && !checkConditions(node)) {
        const nid = getNextNodeId(node);
        if (!nid) return null;
        node = nodeMap[nid];
      }
      return node || null;
    };

    let nodeToRender = resolveRenderable(currentNode);
    if (!nodeToRender) return setCurrentNodeId(null); // end of scene

    const alreadyShown = renderedBlocks.some(
      (b) => b.id && nodeToRender.id && b.id === nodeToRender.id
    );

    // If already shown, advance pointer to next and render that instead
    if (alreadyShown) {
      const nextId = getNextNodeId(nodeToRender);
      if (!nextId) return setCurrentNodeId(null);
      nodeToRender = resolveRenderable(nodeMap[nextId]);
      if (!nodeToRender) return setCurrentNodeId(null);
    }

    // Apply effects and append block
    applyEffects(nodeToRender);
    setRenderedBlocks((prev) => [
      ...prev.slice(-MAX_RENDERED_BLOCKS + 1),
      nodeToRender,
    ]);

    // If it's a choice, enter waiting state and keep pointer on this node
    if (nodeToRender.type === "dialogueChoice") {
      setWaitingChoice(true);
      setCurrentNodeId(nodeToRender.id); // pointer = visible node
      return;
    }

    // Keep pointer on the node we just rendered (advance on next press)
    setCurrentNodeId(nodeToRender.id);
  };

  // --- Handle dialogue choice ---
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
        setCurrentNodeId(nextNode.id); // pointer = visible choice
      } else {
        // pointer = the node we just rendered (advance on next press)
        setCurrentNodeId(nextNode.id);
      }
    } else {
      setCurrentNodeId(null); // end of scene
    }
  };

  // --- Auto-scroll to bottom on new blocks ---
  useEffect(() => {
    if (contentRef.current)
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [renderedBlocks]);

  // --- Portrait handling (last block with a portrait wins) ---
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

        {/* Continue button (hidden during choices) */}
        {!waitingChoice && currentNodeId !== null && (
          <button onClick={renderNext} className="scene-viewer-button">
            {renderedBlocks.length === 0 ? "Begin" : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
}