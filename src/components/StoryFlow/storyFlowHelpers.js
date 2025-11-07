// Provide pure utility functions for StoryFlow logic: conditions, characters, and traversal

// Return true if node has no conditions or all required flags match
export function checkConditions(node, flagSet = {}) {
  if (!node?.conditions) return true;
  return Object.entries(node.conditions).every(([f, v]) => flagSet[f] === v);
}

// Resolve character display data, allowing names to change as flags reveal identity
export function resolveCharacter(charLike, characters = {}, flagSet = {}) {
  const id = typeof charLike === "string" ? charLike : charLike?.id;
  const base = characters[id];
  if (!base) return { id, name: "???", portrait: "" };

  if (Array.isArray(base.nameStates) && base.nameStates.length > 0) {
    const revealed = base.nameStates.find((s) => s.condition && flagSet[s.condition]);
    if (revealed)
      return { id, name: revealed.label, portrait: base.portrait || "" };
    const fallback = base.nameStates.find((s) => !s.condition) || base.nameStates[0];
    return {
      id,
      name: fallback?.label || base.name || "???",
      portrait: base.portrait || "",
    };
  }

  return { id, name: base.name || "???", portrait: base.portrait || "" };
}

// Compute the next traversable node, skipping unmet conditions and preventing loops
export function getNextNodeId(fromNode, flagSet = {}, nodeMap = {}, visited = new Set()) {
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
      return getNextNodeId(nextNode, flagSet, nodeMap, visited);
    return nextNode.id;
  }

  return null;
}