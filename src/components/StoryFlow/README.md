# StoryFlow Module

This folder contains all logic and UI for Paperbacks' narrative system.  
It was refactored from a single large component into smaller, maintainable units.

## Files

### `StoryFlow.jsx`
Top-level orchestrator that wires everything together.  
It connects the story engine, scroll system, and visual subcomponents.

### `StoryFlowContent.jsx`
Responsible for rendering all story node types:
- Paragraph blocks (single or multiple)
- Character dialogues
- Player choices

### `StoryFlowPortrait.jsx`
Displays the portrait of the most recent speaking character.  
Relies on frozen character data to preserve visual history.

### `StoryFlowButton.jsx`
Renders the Begin/Continue button, hiding it when choices are on-screen or the story ends.

### `storyFlowHelpers.js`
Contains pure logic functions:
- `checkConditions()` — Validates flag-based conditions.
- `resolveCharacter()` — Resolves character name and portrait from game state.
- `getNextNodeId()` — Traverses the story graph safely.

## Related

### `src/hooks/useStoryEngine.js`
Encapsulates all story traversal, flag updates, SFX triggers, and auto-scroll behavior.  
Used by `StoryFlow.jsx` to provide clean, declarative state and actions.

---

### Integration overview

```mermaid
flowchart TD
  StoryFlow.jsx --> useStoryEngine.js
  StoryFlow.jsx --> StoryFlowContent.jsx
  StoryFlow.jsx --> StoryFlowPortrait.jsx
  StoryFlow.jsx --> StoryFlowButton.jsx
  useStoryEngine.js --> storyFlowHelpers.js