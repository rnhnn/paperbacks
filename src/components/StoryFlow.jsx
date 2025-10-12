// --- React & styles ---
import "../styles/StoryFlow.css";
import { useState, useEffect, useRef, useMemo } from "react";

// --- Contexts & data ---
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";
import characters from "../data/characters.json";

// --- Constants ---
const MAX_RENDERED_BLOCKS = 10; // limit of visible story blocks

export default function StoryFlow({ story, savedStory, onStorySnapshot }) {
  // --- Build quick lookup for nodes ---
  const nodeMap = useMemo(
    () =>
      Object.fromEntries(
        (story.nodes || []).filter((n) => n.id).map((n) => [n.id, n])
      ),
    [story.nodes]
  );

  // --- Core state ---
  const [currentNodeId, setCurrentNodeId] = useState(() => {
    if (
      savedStory &&
      Object.prototype.hasOwnProperty.call(savedStory, "currentNodeId")
    ) {
      return savedStory.currentNodeId;
    }
    return story.nodes[0]?.id ?? null;
  });

  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [waitingChoice, setWaitingChoice] = useState(false);
  const contentRef = useRef(null);

  // --- Context hooks ---
  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();
  const { flags, setFlag } = useFlags();

  const currentNode = currentNodeId ? nodeMap[currentNodeId] : null;

  // --- Condition & branching helpers ---
  const checkConditions = (node, flagSet = flags) =>
    !node?.conditions ||
    Object.entries(node.conditions).every(([f, v]) => flagSet[f] === v);

  // --- Resolve character info (with dynamic name states) ---
  const resolveCharacter = (charLike, flagSet = flags) => {
    const id = typeof charLike === "string" ? charLike : charLike?.id;
    const base = characters[id];

    if (!base) {
      return { id, name: "???", portrait: "" };
    }

    if (Array.isArray(base.nameStates) && base.nameStates.length > 0) {
      const revealed = base.nameStates.find(
        (s) => s.condition && flagSet[s.condition]
      );
      if (revealed) {
        return {
          id,
          name: revealed.label,
          portrait: base.portrait || "",
        };
      }

      const fallback =
        base.nameStates.find((s) => !s.condition) || base.nameStates[0];

      return {
        id,
        name: fallback?.label || base.name || "???",
        portrait: base.portrait || "",
      };
    }

    return {
      id,
      name: base.name || "???",
      portrait: base.portrait || "",
    };
  };

  // --- Get next valid node (skipping unmet conditions) ---
  const getNextNodeId = (fromNode, flagSet = flags, visited = new Set()) => {
    if (!fromNode || visited.has(fromNode.id)) return null;
    visited.add(fromNode.id);

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
        return getNextNodeId(nextNode, flagSet, visited);
      return nextNode.id;
    }

    return null;
  };

  // --- Apply inventory, notes, and flag effects ---
  const applyEffects = (nodeLike) => {
    if (!nodeLike) return;
    nodeLike.inventoryAdd?.forEach?.(addItem);
    nodeLike.inventoryRemove?.forEach?.(removeItem);
    nodeLike.notesAdd?.forEach?.(addNote);
    if (nodeLike.effects)
      Object.entries(nodeLike.effects).forEach(([f, v]) => setFlag(f, v));
  };

  const setEndOfStory = () => setCurrentNodeId(null);

  // --- Build save snapshot (for SaveSystem) ---
  const getStorySnapshot = () => ({
    currentNodeId,
    renderedBlocks: renderedBlocks
      .slice(-MAX_RENDERED_BLOCKS)
      .map((b) => ({
        id: b.id,
        type: b.type,
        text: b.text,
        character: b.character || null,
        _frozenCharacter: b._frozenCharacter || null,
        // Persist choices to allow restoring during dialogueChoice
        choices: b.type === "dialogueChoice" ? b.choices || [] : undefined,
      })),
  });

  // --- Expose snapshot getter to parent ---
  useEffect(() => {
    if (onStorySnapshot) onStorySnapshot(getStorySnapshot);
  }, [onStorySnapshot, currentNodeId, renderedBlocks]);

  // --- Restore saved story ---
  useEffect(() => {
    if (!savedStory) return;
    console.log("Restoring story from saved state:", savedStory);

    const hasExplicitId = Object.prototype.hasOwnProperty.call(
      savedStory,
      "currentNodeId"
    );
    const startId = hasExplicitId
      ? savedStory.currentNodeId
      : story.nodes[0]?.id ?? null;

    const startNode = startId ? nodeMap[startId] : null;

    if (Array.isArray(savedStory.renderedBlocks)) {
      // restore full frozen blocks directly
      const restored = savedStory.renderedBlocks.map((b) => ({
        ...b,
        // ensure backward compatibility and required fields
        character: b.character || b._frozenCharacter?.id || null,
        // NEW: guard against missing choices
        choices:
          b.type === "dialogueChoice" && !Array.isArray(b.choices)
            ? []
            : b.choices,
      }));
      setRenderedBlocks(restored);
    } else {
      // backward-compatibility: fallback to nodeId list
      const recent = (savedStory.recentNodeIds || [])
        .map((id) => nodeMap[id])
        .filter(Boolean);
      setRenderedBlocks(recent.slice(-MAX_RENDERED_BLOCKS));
    }

    setCurrentNodeId(startId);
    setWaitingChoice(startNode?.type === "dialogueChoice");
  }, [savedStory, nodeMap, story.nodes]);

  // --- Advance story flow ---
  const renderNext = () => {
    if (!currentNode || waitingChoice) return;

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
    if (!nodeToRender) return setEndOfStory();

    const alreadyShown = renderedBlocks.some(
      (b) => b.id && nodeToRender.id && b.id === nodeToRender.id
    );

    if (alreadyShown) {
      const nextId = getNextNodeId(nodeToRender);
      if (!nextId) return setEndOfStory();
      nodeToRender = resolveRenderable(nodeMap[nextId]);
      if (!nodeToRender) return setEndOfStory();
    }

    applyEffects(nodeToRender);

    const frozenBlock =
      nodeToRender.type === "characterDialogue"
        ? {
          ...nodeToRender,
          _frozenCharacter: resolveCharacter(nodeToRender.character),
        }
        : nodeToRender;

    setRenderedBlocks((prev) => [
      ...prev.slice(-MAX_RENDERED_BLOCKS + 1),
      frozenBlock,
    ]);

    if (nodeToRender.type === "dialogueChoice") {
      setWaitingChoice(true);
      setCurrentNodeId(nodeToRender.id);
      return;
    }

    const hasNext =
      nodeToRender.next || (nodeToRender.nextIf?.length ?? 0) > 0;
    if (!hasNext) return setEndOfStory();

    setCurrentNodeId(nodeToRender.id);
  };

  // --- Handle dialogue choices ---
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

    const freezeBlock = (b) =>
      b?.type === "characterDialogue"
        ? { ...b, _frozenCharacter: resolveCharacter(b.character) }
        : b;

    const insert = [freezeBlock(youBlock), ...reactionBlocks.map(freezeBlock)];
    if (nextNode) insert.push(freezeBlock(nextNode));

    setRenderedBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === currentNode?.id);
      const filtered =
        idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
      return [
        ...filtered.slice(-MAX_RENDERED_BLOCKS + insert.length),
        ...insert,
      ];
    });

    setWaitingChoice(false);

    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        setWaitingChoice(true);
        setCurrentNodeId(nextNode.id);
      } else {
        setCurrentNodeId(nextNode.id);
      }
    } else {
      setEndOfStory();
    }
  };

  // --- Auto-scroll to bottom when new text appears ---
  useEffect(() => {
    if (contentRef.current)
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
  }, [renderedBlocks]);

  // --- Determine last portrait to display ---
  const lastPortraitBlock = useMemo(
    () =>
      [...renderedBlocks]
        .reverse()
        .find(
          (b) =>
            (b._frozenCharacter && b._frozenCharacter.portrait) ||
            resolveCharacter(b.character)?.portrait
        ),
    [renderedBlocks]
  );

  // --- Render ---
  return (
    <div className="story-flow">
      {/* Character portrait (last speaker) */}
      {lastPortraitBlock && (
        <div className="story-flow-portrait">
          {(() => {
            const char =
              lastPortraitBlock._frozenCharacter ||
              resolveCharacter(lastPortraitBlock.character);
            return (
              <img
                src={`/assets/portraits/${char.portrait}`}
                alt={char.name}
              />
            );
          })()}
        </div>
      )}

      <div className="story-flow-content" ref={contentRef}>
        {renderedBlocks.map((block, i) => {
          const isCurrent = i === renderedBlocks.length - 1;
          const cls = `story-flow-node${isCurrent ? " is-current" : ""}`;

          if (block.type === "singleParagraph")
            return (
              <div key={block.id || i} className={cls}>
                <p dangerouslySetInnerHTML={{ __html: block.text }} />
              </div>
            );

          if (block.type === "multipleParagraphs")
            return (
              <div key={block.id || i} className={cls}>
                {block.text.map((t, j) => (
                  <p key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: t }} />
                ))}
              </div>
            );

          if (block.type === "characterDialogue") {
            const isYou = block.character?.id === "you"; // detect player
            const char = isYou
              ? { name: "YOU" }
              : block._frozenCharacter || resolveCharacter(block.character);
            const name = char.name.toUpperCase();
            const text = Array.isArray(block.text)
              ? block.text.join(" ")
              : block.text;

            return (
              <div key={block.id || i} className={cls}>
                <p>
                  <strong style={{ textTransform: "uppercase" }}>{name} —</strong>{" "}
                  <span dangerouslySetInnerHTML={{ __html: text }} />
                </p>
              </div>
            );
          }

          if (block.type === "dialogueChoice") {
            // Guard for missing choices during load
            const safeChoices = Array.isArray(block.choices)
              ? block.choices
              : [];
            return (
              <div key={block.id || i} className={cls}>
                <ol className="story-flow-dialogue-list">
                  {safeChoices.map((c, j) => (
                    <li key={j} className="story-flow-dialogue-list-option">
                      <button onClick={() => handleChoice(c)}>{c.text}</button>
                    </li>
                  ))}
                </ol>
              </div>
            );
          }

          return null;
        })}
      </div>

      {!waitingChoice && currentNodeId !== null && (
        <button onClick={renderNext} className="story-flow-button">
          {renderedBlocks.length === 0 ? "Begin" : "Continue"}
        </button>
      )}
    </div>
  );
}