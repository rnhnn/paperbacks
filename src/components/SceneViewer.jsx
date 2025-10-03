import "../styles/SceneViewer.css";
import { useState } from "react";

export default function SceneViewer({ scene }) {
  // State: what’s already rendered on screen
  const [renderedBlocks, setRenderedBlocks] = useState([]);
  // State: the queue of blocks left to display
  const [queue, setQueue] = useState([...scene.content]);
  // State: "flags" keep track of choices/conditions the player triggered
  const [flags, setFlags] = useState({});
  // State: whether the game is waiting for a dialogue choice
  const [waitingChoice, setWaitingChoice] = useState(false);

  /**
   * Advance the story by rendering the next eligible block from the queue.
   * - Skips blocks whose conditions don’t match current flags.
   * - Stops if there’s no block left, or if we’re currently waiting for a choice.
   */
  const renderNext = () => {
    if (queue.length === 0 || waitingChoice) return;

    let remaining = [...queue]; // shallow copy of the queue
    let nextBlock = null;

    // Find the next block that meets its conditions (if any)
    while (remaining.length > 0) {
      const candidate = remaining[0];

      // If block has conditions and they’re not met, skip it
      if (
        candidate.conditions &&
        !Object.entries(candidate.conditions).every(([k, v]) => flags[k] === v)
      ) {
        remaining.shift();
        continue;
      }

      // Otherwise, this block is the next one to render
      nextBlock = candidate;
      remaining.shift();
      break;
    }

    setQueue(remaining);

    // If nothing renderable was found, stop
    if (!nextBlock) return;

    // Add this block to the rendered list
    setRenderedBlocks((prev) => [...prev, nextBlock]);

    // If it’s a choice block, stop advancing until player picks one
    if (nextBlock.type === "dialogueChoice") {
      setWaitingChoice(true);
    }
  };

  /**
   * Handles what happens when a choice is clicked:
   * - Apply its effects (set flags).
   * - Insert a "You — ..." block to represent the player’s choice.
   * - Immediately insert the reaction blocks defined in the choice.
   * - Remove the choice menu from renderedBlocks so it can't be picked again.
   * - Resume flow (not waiting anymore).
   */
  const handleChoice = (choice) => {
    // Merge choice.effects into flags
    setFlags((prev) => ({ ...prev, ...(choice.effects || {}) }));

    // Represent the player’s choice as dialogue
    const youBlock = {
      type: "characterDialogue",
      character: { id: "you", name: "You" },
      text: [choice.text],
    };

    // Reaction blocks defined in the JSON
    const reactionBlocks = choice.reaction || [];

    // Remove the dialogueChoice block from renderedBlocks
    setRenderedBlocks((prev) => [
      ...prev.filter((b) => b.type !== "dialogueChoice"),
      youBlock,
      ...reactionBlocks,
    ]);

    // Resume flow (Continue button can appear again if queue has stuff left)
    setWaitingChoice(false);
  };

  /**
   * Utility to check if a block is renderable given current flags.
   */
  const isRenderable = (block) =>
    !block.conditions || Object.entries(block.conditions).every(([k, v]) => flags[k] === v);

  /**
   * Look backwards through rendered blocks to find
   * the last one with a character portrait.
   * That portrait is what we display on screen.
   */
  const lastPortraitBlock = [...renderedBlocks].reverse().find(
    (b) => b.character?.portrait
  );

  return (
    <div>
      <div className="scene-viewer-text">
        {/* Show the most recent speaker’s portrait */}
        {lastPortraitBlock && (
          <div className="scene-viewer-portrait">
            <img
              src={new URL(
                `../assets/portraits/${lastPortraitBlock.character.portrait}`,
                import.meta.url
              ).href}
              alt={lastPortraitBlock.character.name}
            />
          </div>
        )}

        {/* Render each block that has been revealed so far */}
        {renderedBlocks.map((block, idx) => {
          // Determine if this is the last block rendered
          const isCurrent = idx === renderedBlocks.length - 1;
          const blockClass = `scene-viewer-block${isCurrent ? " is-current" : ""}`;

          // Narrative text (single paragraph)
          if (block.type === "singleParagraph") {
            return (
              <div key={idx} className={blockClass}>
                <p>{block.text}</p>
              </div>
            );
          }

          // Narrative text (multiple paragraphs)
          if (block.type === "multipleParagraphs") {
            return (
              <div key={idx} className={blockClass}>
                {block.text.map((t, tIdx) => (
                  <p key={`${idx}-${tIdx}`}>{t}</p>
                ))}
              </div>
            );
          }

          // Character dialogue
          if (block.type === "characterDialogue") {
            const characterName = block.character?.name?.toUpperCase() || "???";
            const dialogueText = Array.isArray(block.text) ? block.text.join(" ") : block.text;

            return (
              <div key={idx} className={blockClass}>
                <p>
                  <strong style={{ textTransform: "uppercase" }}>{characterName} —</strong>{" "}
                  {dialogueText}
                </p>
              </div>
            );
          }

          // Choice menu
          if (block.type === "dialogueChoice") {
            return (
              <div key={idx} className={`${blockClass} scene-viewer-dialogue-list`}>
                <ol>
                  {block.choices.map((choice) => (
                    <li key={choice.id}>
                      <button onClick={() => handleChoice(choice)}>{choice.text}</button>
                    </li>
                  ))}
                </ol>
              </div>
            );
          }

          return null; // Unknown block type
        })}

        {/* Continue button: only visible if:
              - Not waiting on a choice
              - There are still renderable blocks left in queue */}
        {!waitingChoice &&
          queue.some((b) => isRenderable(b)) && (
            <button onClick={renderNext}>Continue</button>
          )}
      </div>
    </div>
  );
}
