// Compute initial node id using save when available
export function getInitialNodeId(localizedStory, savedStory) {
  return savedStory?.currentNodeId ?? localizedStory.nodes[0]?.id ?? null;
}

// Restore StoryFlow state from a saved story using the current save format only
export function hydrateFromSavedStory({
  savedStory,
  nodeMap,
  setRenderedBlocks,
  setCurrentNodeId,
  setWaitingChoice,
  maxRenderedBlocks,
}) {
  if (!savedStory) return;

  const { currentNodeId, renderedBlocks } = savedStory;
  if (!currentNodeId || !Array.isArray(renderedBlocks)) return;

  const startNode = nodeMap[currentNodeId] || null;

  // Limit restored blocks to the configured window size
  const limited =
    typeof maxRenderedBlocks === "number" && maxRenderedBlocks > 0
      ? renderedBlocks.slice(-maxRenderedBlocks)
      : renderedBlocks;

  // Normalize blocks to guard against small format tweaks
  const normalized = limited.map((b) => ({
    ...b,
    character: b.character || b._frozenCharacter?.id || null,
    choices:
      b.type === "dialogueChoice" && !Array.isArray(b.choices)
        ? []
        : b.choices,
  }));

  setRenderedBlocks(normalized);
  setCurrentNodeId(currentNodeId);
  setWaitingChoice(startNode?.type === "dialogueChoice");
}

// Build a compact snapshot capturing current position and recent blocks
export function buildStorySnapshot({
  currentNodeId,
  renderedBlocks,
  maxRenderedBlocks,
}) {
  const limited =
    typeof maxRenderedBlocks === "number" && maxRenderedBlocks > 0
      ? renderedBlocks.slice(-maxRenderedBlocks)
      : renderedBlocks;

  return {
    currentNodeId,
    renderedBlocks: limited.map((b) => ({
      id: b.id,
      type: b.type,
      text: b.text,
      character: b.character || null,
      _frozenCharacter: b._frozenCharacter || null,
      choices: b.type === "dialogueChoice" ? b.choices || [] : undefined,
      graphic: b.graphic || null,
    })),
  };
}