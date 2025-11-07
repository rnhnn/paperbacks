// Render all story blocks (paragraphs, dialogues, and choices) inside StoryFlow
import { forwardRef } from "react";
import { resolveCharacter } from "./storyFlowHelpers";

const StoryFlowContent = forwardRef(function StoryFlowContent(
  { renderedBlocks, handleChoice, textData },
  ref
) {
  const { characters } = textData;

  return (
    <div className="story-flow-content has-scroll" ref={ref}>
      {renderedBlocks.map((block, i) => {
        const isCurrent = i === renderedBlocks.length - 1;
        const cls = `story-flow-node${isCurrent ? " is-current" : ""}`;

        // Render a single HTML paragraph block
        if (block.type === "singleParagraph")
          return (
            <div key={block.id || i} className={cls}>
              <p
                className="story-flow-node-paragraph"
                dangerouslySetInnerHTML={{ __html: block.text }}
              />
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
            : block._frozenCharacter ||
              resolveCharacter(block.character, characters);
          const name = char.name.toUpperCase();
          const text = Array.isArray(block.text)
            ? block.text.join(" ")
            : block.text;

          return (
            <div key={block.id || i} className={cls}>
              <p>
                <span className="story-flow-node-character">{name} —</span>{" "}
                <span dangerouslySetInnerHTML={{ __html: text }} />
              </p>
            </div>
          );
        }

        // Render an ordered list of dialogue choices
        if (block.type === "dialogueChoice") {
          const safeChoices = Array.isArray(block.choices) ? block.choices : [];
          return (
            <div key={block.id || i} className={cls}>
              <ol className="story-flow-dialogue-list">
                {safeChoices.map((c, j) => (
                  <li key={j} className="story-flow-dialogue-list-option">
                    <button
                      onClick={() => handleChoice(c)}
                      className="story-flow-dialogue-list-option-button"
                    >
                      <span className="story-flow-option-number">
                        {j + 1}.
                      </span>{" "}
                      {c.text}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        // Ignore unknown block types
        return null;
      })}
    </div>
  );
});

export default StoryFlowContent;