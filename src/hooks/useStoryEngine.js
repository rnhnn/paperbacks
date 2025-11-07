// Manage the entire story logic, traversal, and state transitions for StoryFlow
import { useState, useEffect, useRef, useMemo } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { useNotes } from "../contexts/NotesContext";
import { useFlags } from "../contexts/FlagsContext";
import { checkConditions, resolveCharacter, getNextNodeId } from "../components/StoryFlow/storyFlowUtils";

const MAX_RENDERED_BLOCKS = 10;

export function useStoryEngine({
  story,
  savedStory,
  textData,
  onStorySnapshot,
  onBegin,
  onAmbienceChange,
  onSFX,
  contentRef,
}) {
  const { characters } = textData;
  const localizedStory = textData.story || story;

  const nodeMap = useMemo(
    () =>
      Object.fromEntries(
        (localizedStory.nodes || []).filter((n) => n.id).map((n) => [n.id, n])
      ),
    [localizedStory.nodes]
  );

  const [currentNodeId, setCurrentNodeId] = useState(() => {
    if (savedStory && Object.prototype.hasOwnProperty.call(savedStory, "currentNodeId"))
      return savedStory.currentNodeId;
    return localizedStory.nodes[0]?.id ?? null;
  });

  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [waitingChoice, setWaitingChoice] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const hasBegunRef = useRef(false);
  const hasTriggeredInitialAmbience = useRef(false);

  const { addItem, removeItem } = useInventory();
  const { addNote } = useNotes();
  const { flags, setFlag } = useFlags();

  const currentNode = currentNodeId ? nodeMap[currentNodeId] : null;

  // Apply node effects (inventory, notes, flags)
  const applyEffects = (nodeLike) => {
    if (!nodeLike) return;
    nodeLike.inventoryAdd?.forEach?.(addItem);
    nodeLike.inventoryRemove?.forEach?.(removeItem);
    nodeLike.notesAdd?.forEach?.(addNote);
    if (nodeLike.effects)
      Object.entries(nodeLike.effects).forEach(([f, v]) => setFlag(f, v));
  };

  // Mark story end
  const setEndOfStory = () => setCurrentNodeId(null);

  // Build snapshot for save system
  const getStorySnapshot = () => ({
    currentNodeId,
    renderedBlocks: renderedBlocks.slice(-MAX_RENDERED_BLOCKS).map((b) => ({
      id: b.id,
      type: b.type,
      text: b.text,
      character: b.character || null,
      _frozenCharacter: b._frozenCharacter || null,
      choices: b.type === "dialogueChoice" ? b.choices || [] : undefined,
    })),
  });

  // Expose snapshot builder
  useEffect(() => {
    if (onStorySnapshot) onStorySnapshot(getStorySnapshot);
  }, [onStorySnapshot, currentNodeId, renderedBlocks]);

  // Initialize ambience once
  useEffect(() => {
    if (
      !hasTriggeredInitialAmbience.current &&
      onAmbienceChange &&
      localizedStory.initialAmbience
    ) {
      const startId = savedStory?.currentNodeId ?? localizedStory.nodes[0]?.id;
      const startNode = startId ? nodeMap[startId] : null;
      if (!startNode?.setAmbience) {
        const ia = localizedStory.initialAmbience;
        const id = typeof ia === "string" ? ia : ia?.id;
        const volume = typeof ia === "object" && ia?.volume != null ? ia.volume : 1;
        onAmbienceChange(id, volume);
        hasTriggeredInitialAmbience.current = true;
      }
    }
  }, [onAmbienceChange, localizedStory.initialAmbience, savedStory, nodeMap]);

  // React to ambience changes in node
  useEffect(() => {
    if (onAmbienceChange && currentNode?.setAmbience) {
      const sa = currentNode.setAmbience;
      const id = typeof sa === "string" ? sa : sa?.id;
      const volume = typeof sa === "object" && sa?.volume != null ? sa.volume : 1;
      onAmbienceChange(id, volume);
    }
  }, [onAmbienceChange, currentNode]);

  // Restore save state
  useEffect(() => {
    if (!savedStory) return;
    const hasExplicitId = Object.prototype.hasOwnProperty.call(savedStory, "currentNodeId");
    const startId = hasExplicitId
      ? savedStory.currentNodeId
      : localizedStory.nodes[0]?.id ?? null;

    const startNode = startId ? nodeMap[startId] : null;

    if (Array.isArray(savedStory.renderedBlocks)) {
      const restored = savedStory.renderedBlocks.map((b) => ({
        ...b,
        character: b.character || b._frozenCharacter?.id || null,
        choices: b.type === "dialogueChoice" && !Array.isArray(b.choices) ? [] : b.choices,
      }));
      setRenderedBlocks(restored);
    } else {
      const recent = (savedStory.recentNodeIds || [])
        .map((id) => nodeMap[id])
        .filter(Boolean);
      setRenderedBlocks(recent.slice(-MAX_RENDERED_BLOCKS));
    }

    setCurrentNodeId(startId);
    setWaitingChoice(startNode?.type === "dialogueChoice");
  }, [savedStory, nodeMap, localizedStory.nodes]);

  // Advance to next renderable node
  const renderNext = () => {
    if (!currentNode || waitingChoice) return;

    const resolveRenderable = (start) => {
      let node = start;
      while (node && !checkConditions(node, flags)) {
        const nid = getNextNodeId(node, flags, nodeMap);
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
      const nextId = getNextNodeId(nodeToRender, flags, nodeMap);
      if (!nextId) return setEndOfStory();
      nodeToRender = resolveRenderable(nodeMap[nextId]);
      if (!nodeToRender) return setEndOfStory();
    }

    applyEffects(nodeToRender);

    if (onSFX && nodeToRender.playSFX) {
      const ps = nodeToRender.playSFX;
      const id = typeof ps === "string" ? ps : ps?.id;
      const volume = typeof ps === "object" && ps?.volume != null ? ps.volume : 1;
      onSFX(id, volume);
    }

    const frozenBlock =
      nodeToRender.type === "characterDialogue"
        ? { ...nodeToRender, _frozenCharacter: resolveCharacter(nodeToRender.character, characters, flags) }
        : nodeToRender;

    setRenderedBlocks((prev) => [...prev.slice(-MAX_RENDERED_BLOCKS + 1), frozenBlock]);

    if (nodeToRender.type === "dialogueChoice") {
      setWaitingChoice(true);
      setCurrentNodeId(nodeToRender.id);
      return;
    }

    const hasNext = nodeToRender.next || (nodeToRender.nextIf?.length ?? 0) > 0;
    if (!hasNext) return setEndOfStory();
    setCurrentNodeId(nodeToRender.id);
  };

  // Handle Begin button
  const handleBegin = () => {
    if (!hasBegunRef.current) {
      hasBegunRef.current = true;
      if (onBegin) onBegin();
    }
    renderNext();
  };

  // Handle choice selection
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

    const nextId = choice.next || getNextNodeId(currentNode, mergedFlags, nodeMap);
    const nextNode = nextId ? nodeMap[nextId] : null;
    applyEffects(nextNode);

    if (onSFX && nextNode?.playSFX) {
      const ps = nextNode.playSFX;
      const id = typeof ps === "string" ? ps : ps?.id;
      const volume = typeof ps === "object" && ps?.volume != null ? ps.volume : 1;
      onSFX(id, volume);
    }

    const freezeBlock = (b) =>
      b?.type === "characterDialogue"
        ? { ...b, _frozenCharacter: resolveCharacter(b.character, characters, flags) }
        : b;

    const insert = [freezeBlock(youBlock), ...reactionBlocks.map(freezeBlock)];
    if (nextNode) insert.push(freezeBlock(nextNode));

    setRenderedBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === currentNode?.id);
      const filtered = idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
      return [...filtered.slice(-MAX_RENDERED_BLOCKS + insert.length), ...insert];
    });

    setWaitingChoice(false);
    if (nextNode) {
      if (nextNode.type === "dialogueChoice") {
        setWaitingChoice(true);
        setCurrentNodeId(nextNode.id);
      } else setCurrentNodeId(nextNode.id);
    } else setEndOfStory();
  };

  // Auto-scroll
  useEffect(() => {
    if (!contentRef.current) return;
    setIsAutoScrolling(true);
    contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" });
    const timer = setTimeout(() => setIsAutoScrolling(false), 600);
    return () => clearTimeout(timer);
  }, [renderedBlocks]);

  // Compute portrait block
  const lastPortraitBlock = useMemo(
    () =>
      [...renderedBlocks]
        .reverse()
        .find(
          (b) =>
            (b._frozenCharacter && b._frozenCharacter.portrait) ||
            resolveCharacter(b.character, characters, flags)?.portrait
        ),
    [renderedBlocks, characters, flags]
  );

  return {
    renderedBlocks,
    waitingChoice,
    currentNodeId,
    lastPortraitBlock,
    handleChoice,
    handleBegin,
    renderNext,
    isAutoScrolling,
  };
}