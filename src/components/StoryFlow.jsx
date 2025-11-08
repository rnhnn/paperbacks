// Drive the narrative flow, rendering story nodes, choices, and player progression

// React and styles
import "../styles/StoryFlow.css";
import { useState, useEffect, useRef, useMemo } from "react";

// Contexts and data
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";
import useText from "../hooks/useText"; // Added: hook for localized text
import useScrollArrows from "../hooks/useScrollArrows"; // Added
import "../styles/ScrollArrows.css"; // Added

// Constants
const MAX_RENDERED_BLOCKS = 10; // Limit number of rendered blocks kept in memory and DOM

export default function StoryFlow({
  story,
  savedStory,
  onStorySnapshot,
  onBegin,
  onAmbienceChange,
  onSFX,
}) {
  // Use the translated version of the story when available, otherwise fall back to the base English version
  const { t, textData } = useText();
  const characters = textData.characters;
  const localizedStory = textData.story || story;

  // Build O(1) node lookup from story.nodes using node id as key
  const nodeMap = useMemo(
    () =>
      Object.fromEntries(
        (localizedStory.nodes || []).filter((n) => n.id).map((n) => [n.id, n])
      ),
    [localizedStory.nodes]
  );

  // Initialize current node from save when available, otherwise first node
  const [currentNodeId, setCurrentNodeId] = useState(() => {
    if (
      savedStory &&
      Object.prototype.hasOwnProperty.call(savedStory, "currentNodeId")
    ) {
      return savedStory.currentNodeId;
    }
    return localizedStory.nodes[0]?.id ?? null;
  });

  // Keep a sliding window of previously rendered blocks for UI and persistence
  const [renderedBlocks, setRenderedBlocks] = useState([]);

  // Gate user input when a choice is visible to prevent accidental progression
  const [waitingChoice, setWaitingChoice] = useState(false);

  // Track whether autoscrolling is in progress
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Ref to the scrollable container to auto-scroll on new content
  const contentRef = useRef(null);

  // Track if Begin was already pressed (prevents multiple onBegin calls)
  const hasBegunRef = useRef(false);

  // Enable custom scroll arrows for this story log
  useScrollArrows(contentRef, { step: 24, isAutoScrolling });

  // Access gameplay mutation hooks for inventory, notes, and flags
  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();
  const { flags, setFlag } = useFlags();

  // Resolve the live node object for the current node id
  const currentNode = currentNodeId ? nodeMap[currentNodeId] : null;

  // Track if initial ambience has been triggered to avoid double-playing
  const hasTriggeredInitialAmbience = useRef(false);

  // Initialize ambience layer when story starts or when loading a save
  useEffect(() => {
    if (
      !hasTriggeredInitialAmbience.current &&
      onAmbienceChange &&
      localizedStory.initialAmbience
    ) {
      // Determine whether the current node already defines its own ambience
      const startingNodeId =
        savedStory?.currentNodeId ?? localizedStory.nodes[0]?.id;
      const startingNode = startingNodeId ? nodeMap[startingNodeId] : null;

      const nodeHasOwnAmbience = startingNode?.setAmbience;

      // Trigger story-level ambience only if the starting node doesn’t override it
      if (!nodeHasOwnAmbience) {
        // Support object form: { id, volume } and legacy string id
        const ia = localizedStory.initialAmbience;
        const id = typeof ia === "string" ? ia : ia?.id;
        const volume = typeof ia === "object" && ia?.volume != null ? ia.volume : 1;
        console.log("[StoryFlow] onAmbienceChange →", id, volume);
        onAmbienceChange(id, volume);
        hasTriggeredInitialAmbience.current = true;
      }
    }
  }, [onAmbienceChange, localizedStory.initialAmbience, savedStory, nodeMap]);

  // Detect ambience changes when the current node defines a new ambience key
  useEffect(() => {
    if (onAmbienceChange && currentNode?.setAmbience) {
      // Support object form: { id, volume } and legacy string id
      const sa = currentNode.setAmbience;
      const id = typeof sa === "string" ? sa : sa?.id;
      const volume = typeof sa === "object" && sa?.volume != null ? sa.volume : 1;
      onAmbienceChange(id, volume);
    }
  }, [onAmbienceChange, currentNode]);

  // Return true if a node has no conditions or all required flags match
  const checkConditions = (node, flagSet = flags) =>
    !node?.conditions ||
    Object.entries(node.conditions).every(([f, v]) => flagSet[f] === v);

  // Resolve character display data, allowing names to change as flags reveal identity
  const resolveCharacter = (charLike, flagSet = flags) => {
    const id = typeof charLike === "string" ? charLike : charLike?.id;
    const base = characters[id];
    if (!base) return { id, name: "???", portrait: "" };

    if (Array.isArray(base.nameStates) && base.nameStates.length > 0) {
      const revealed = base.nameStates.find(
        (s) => s.condition && flagSet[s.condition]
      );
      if (revealed)
        return { id, name: revealed.label, portrait: base.portrait || "" };
      const fallback =
        base.nameStates.find((s) => !s.condition) || base.nameStates[0];
      return {
        id,
        name: fallback?.label || base.name || "???",
        portrait: base.portrait || "",
      };
    }

    return { id, name: base.name || "???", portrait: base.portrait || "" };
  };

  // Compute the next traversable node, skipping nodes whose conditions are not met
  const getNextNodeId = (fromNode, flagSet = flags, visited = new Set()) => {
    if (!fromNode || visited.has(fromNode.id)) return null; // Prevent loops
    visited.add(fromNode.id);

    // Prefer conditional branches (nextIf) when their conditions pass
    if (Array.isArray(fromNode.nextIf)) {
      for (const branch of fromNode.nextIf) {
        const pass =
          !branch.conditions ||
          Object.entries(branch.conditions).every(([f, v]) => flagSet[f] === v);
        if (pass && branch.next && nodeMap[branch.next]) return branch.next;
      }
    }

    // Fallback to linear next, recursively skipping unmet nodes
    if (fromNode.next && nodeMap[fromNode.next]) {
      const nextNode = nodeMap[fromNode.next];
      if (!checkConditions(nextNode, flagSet))
        return getNextNodeId(nextNode, flagSet, visited);
      return nextNode.id;
    }

    // Reached end of graph for this path
    return null;
  };

  // Apply node side effects that mutate the player state (inventory, notes, flags)
  const applyEffects = (nodeLike) => {
    if (!nodeLike) return;
    nodeLike.inventoryAdd?.forEach?.(addItem);
    nodeLike.inventoryRemove?.forEach?.(removeItem);
    nodeLike.notesAdd?.forEach?.(addNote);
    if (nodeLike.effects)
      Object.entries(nodeLike.effects).forEach(([f, v]) => setFlag(f, v));
  };

  // Mark story ended by clearing the current node id
  const setEndOfStory = () => setCurrentNodeId(null);

  // Build a compact snapshot capturing current position and recent blocks
  const getStorySnapshot = () => ({
    currentNodeId,
    renderedBlocks: renderedBlocks
      .slice(-MAX_RENDERED_BLOCKS)
      .map((b) => ({
        id: b.id,
        type: b.type,
        text: b.text,
        character: b.character || null, // Keep original author info
        _frozenCharacter: b._frozenCharacter || null, // Keep resolved name/portrait at render time
        choices: b.type === "dialogueChoice" ? b.choices || [] : undefined, // Persist visible choices
      })),
  });

  // Provide snapshot getter to the parent so Quick Save can pull latest state
  useEffect(() => {
    if (onStorySnapshot) onStorySnapshot(getStorySnapshot);
  }, [onStorySnapshot, currentNodeId, renderedBlocks]);

  // Restore a saved story by hydrating blocks and position with backward compatibility
  useEffect(() => {
    if (!savedStory) return;

    const hasExplicitId = Object.prototype.hasOwnProperty.call(
      savedStory,
      "currentNodeId"
    );
    const startId = hasExplicitId
      ? savedStory.currentNodeId
      : localizedStory.nodes[0]?.id ?? null;

    const startNode = startId ? nodeMap[startId] : null;

    if (Array.isArray(savedStory.renderedBlocks)) {
      // Restore previously frozen blocks to preserve names and portraits
      const restored = savedStory.renderedBlocks.map((b) => ({
        ...b,
        character: b.character || b._frozenCharacter?.id || null, // Guard older saves
        choices:
          b.type === "dialogueChoice" && !Array.isArray(b.choices)
            ? []
            : b.choices,
      }));
      setRenderedBlocks(restored);
    } else {
      // Fallback path for older save format that only stored recent node ids
      const recent = (savedStory.recentNodeIds || [])
        .map((id) => nodeMap[id])
        .filter(Boolean);
      setRenderedBlocks(recent.slice(-MAX_RENDERED_BLOCKS));
    }

    setCurrentNodeId(startId);
    setWaitingChoice(startNode?.type === "dialogueChoice"); // Resume with choice gate if needed
  }, [savedStory, nodeMap, localizedStory.nodes]);

  // Advance the narrative by resolving the next renderable node and applying effects
  const renderNext = () => {
    if (!currentNode || waitingChoice) return; // Do nothing while a choice is displayed

    // Skip nodes that fail conditions until we find a renderable node or end
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

    // Avoid re-rendering the same node when resuming or after effects
    const alreadyShown = renderedBlocks.some(
      (b) => b.id && nodeToRender.id && b.id === nodeToRender.id
    );

    // If already shown, try to hop to the next valid node in the chain
    if (alreadyShown) {
      const nextId = getNextNodeId(nodeToRender);
      if (!nextId) return setEndOfStory();
      nodeToRender = resolveRenderable(nodeMap[nextId]);
      if (!nodeToRender) return setEndOfStory();
    }

    // Apply node effects before freezing, so UI reflects stateful consequences
    applyEffects(nodeToRender);

    // Trigger one-shot SFX when node defines playSFX
    if (onSFX && nodeToRender.playSFX) {
      // Support object form: { id, volume } and legacy string id
      const ps = nodeToRender.playSFX;
      const id = typeof ps === "string" ? ps : ps?.id;
      const volume = typeof ps === "object" && ps?.volume != null ? ps.volume : 1;
      onSFX(id, volume);
    }

    // Freeze character at render-time so later flag changes do not rewrite history
    const frozenBlock =
      nodeToRender.type === "characterDialogue"
        ? {
            ...nodeToRender,
            _frozenCharacter: resolveCharacter(nodeToRender.character),
          }
        : nodeToRender;

    // Append block while keeping only the last N items for performance
    setRenderedBlocks((prev) => [
      ...prev.slice(-MAX_RENDERED_BLOCKS + 1),
      frozenBlock,
    ]);

    // Stop progression and wait for player input if we rendered a choice
    if (nodeToRender.type === "dialogueChoice") {
      setWaitingChoice(true);
      setCurrentNodeId(nodeToRender.id);
      return;
    }

    // Continue traversal if there are follow-up nodes; otherwise mark end
    const hasNext =
      nodeToRender.next || (nodeToRender.nextIf?.length ?? 0) > 0;
    if (!hasNext) return setEndOfStory();

    // Persist current position so the next click advances from here
    setCurrentNodeId(nodeToRender.id);
  };

  // Handle Begin button press (fires onBegin once, then renders first node)
  const handleBegin = () => {
    if (!hasBegunRef.current) {
      hasBegunRef.current = true;
      if (onBegin) onBegin();
    }
    renderNext();
  };

  // Handle a selected choice by rendering player line, reactions, and next node
  const handleChoice = (choice) => {
    const mergedFlags = { ...flags, ...(choice.effects || {}) }; // Predict flags for branch resolution
    if (choice.effects)
      Object.entries(choice.effects).forEach(([f, v]) => setFlag(f, v)); // Commit flag effects

    // Render the player’s spoken line as a dialogue block ("YOU")
    const youBlock = {
      type: "characterDialogue",
      character: { id: "you", name: "You" },
      text: [choice.text],
    };

    // Apply reaction block effects before inserting them
    const reactionBlocks = choice.reaction || [];
    reactionBlocks.forEach(applyEffects);

    // Determine next node using explicit next or by resolving branches with merged flags
    const nextId = choice.next || getNextNodeId(currentNode, mergedFlags);
    const nextNode = nextId ? nodeMap[nextId] : null;

    // Apply next node effects early to keep state consistent with what will render
    applyEffects(nextNode);

    // Trigger one-shot SFX when next node defines playSFX
    if (onSFX && nextNode?.playSFX) {
      // Support object form: { id, volume } and legacy string id
      const ps = nextNode.playSFX;
      const id = typeof ps === "string" ? ps : ps?.id;
      const volume = typeof ps === "object" && ps?.volume != null ? ps.volume : 1;
      onSFX(id, volume);
    }

    // Freeze all blocks that show characters so names/portraits stay consistent
    const freezeBlock = (b) =>
      b?.type === "characterDialogue"
        ? { ...b, _frozenCharacter: resolveCharacter(b.character) }
        : b;

    // Insert the sequence: YOU line → reactions → immediate next node
    const insert = [freezeBlock(youBlock), ...reactionBlocks.map(freezeBlock)];
    if (nextNode) insert.push(freezeBlock(nextNode));

    // Replace the current-node placeholder if present, then append the new sequence
    setRenderedBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === currentNode?.id);
      const filtered = idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
      return [
        ...filtered.slice(-MAX_RENDERED_BLOCKS + insert.length),
        ...insert,
      ];
    });

    // Exit choice mode and set up the next progression point
    setWaitingChoice(false);

    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        setWaitingChoice(true); // Enter choice mode again if next node is a choice
        setCurrentNodeId(nextNode.id);
      } else {
        setCurrentNodeId(nextNode.id); // Continue linear traversal from next node
      }
    } else {
      setEndOfStory(); // No next node means the path ended after the choice
    }
  };

  // Auto-scroll to bottom when new blocks are rendered
  useEffect(() => {
    if (!contentRef.current) return;

    // Mark autoscrolling as active to hide bottom arrow
    setIsAutoScrolling(true);

    contentRef.current.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: "smooth",
    });

    // Restore arrow visibility after scroll settles
    const timer = setTimeout(() => setIsAutoScrolling(false), 600);
    return () => clearTimeout(timer);
  }, [renderedBlocks]);

  // Pick the most recent block with a portrait to display in the side panel
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

  // Render the story UI with portrait, content feed, and progression controls
  return (
    <div className="story-flow has-scroll-parent">
      {/* Portrait of the last speaking character */}
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

      <div className="story-flow-content has-scroll" ref={contentRef}>
        {renderedBlocks.map((block, i) => {
          const isCurrent = i === renderedBlocks.length - 1; // Mark last block for subtle emphasis
          const cls = `story-flow-node${isCurrent ? " is-current" : ""}`;

          // Render a single HTML paragraph block
          if (block.type === "singleParagraph")
            return (
              <div key={block.id || i} className={cls}>
                <p className="story-flow-node-pargraph" dangerouslySetInnerHTML={{ __html: block.text }} />
              </div>
            );

          // Render multiple HTML paragraphs as a sequence
          if (block.type === "multipleParagraphs")
            return (
              <div key={block.id || i} className={cls}>
                {block.text.map((t, j) => (
                  <p key={`${i}-${j}`} dangerouslySetInnerHTML={{ __html: t }} />
                ))}
              </div>
            );

          // Render a dialogue line with uppercase speaker label
          if (block.type === "characterDialogue") {
            const isYou = block.character?.id === "you";
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
                  <span className="story-flow-node-character">
                    {name} —
                  </span>{" "}
                  <span dangerouslySetInnerHTML={{ __html: text }} />
                </p>
              </div>
            );
          }

          // Render an ordered list of choices that call handleChoice on click
          if (block.type === "dialogueChoice") {
            const safeChoices = Array.isArray(block.choices) ? block.choices : [];
            return (
              <div key={block.id || i} className={cls}>
                <ol className="story-flow-dialogue-list">
                  {safeChoices.map((c, j) => (
                    <li key={j} className="story-flow-dialogue-list-option">
                      <button onClick={() => handleChoice(c)} className="story-flow-dialogue-list-option-button">
                        <span className="story-flow-option-number">{j + 1}.</span>{" "}
                        <span dangerouslySetInnerHTML={{ __html: c.text }} />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            );
          }

          // Ignore unknown block types for forward compatibility
          return null;
        })}
      </div>

      {/* Continue button is hidden when a choice is on-screen or the story ended */}
      <div className="story-flow-button-area">
        {!waitingChoice && currentNodeId !== null && (
          <button
            onClick={renderedBlocks.length === 0 ? handleBegin : renderNext}
            className="story-flow-button"
          >
            {renderedBlocks.length === 0
              ? t("ui.storyFlow.begin")
              : t("ui.storyFlow.continue")}
          </button>
        )}
      </div>
    </div>
  );
}