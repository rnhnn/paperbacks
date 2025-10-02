import "../styles/SceneViewer.css";
import { useState } from "react";

export default function SceneViewer({ scene }) {
  const [renderedBlocks, setRenderedBlocks] = useState([]);
  const [queue, setQueue] = useState([...scene.content]);
  const [flags, setFlags] = useState({});
  const [waitingChoice, setWaitingChoice] = useState(false);

  const renderNext = () => {
    if (queue.length === 0 || waitingChoice) return;

    const [nextBlock, ...rest] = queue;

    if (
      nextBlock.conditions &&
      !Object.entries(nextBlock.conditions).every(([k, v]) => flags[k] === v)
    ) {
      setQueue(rest);
      renderNext();
      return;
    }

    setRenderedBlocks((prev) => [...prev, nextBlock]);
    setQueue(rest);

    if (nextBlock.type === "dialogueChoice") {
      setWaitingChoice(true);
    }
  };

  const handleChoice = (choice) => {
    setFlags((prev) => ({ ...prev, ...choice.effects }));

    if (choice.next) {
      setRenderedBlocks((prev) => [...prev, ...choice.next]);
    }

    setWaitingChoice(false);
    renderNext();
  };

  return (
    <div>
      <div className="scene-viewer-text">
        {renderedBlocks.length > 0 &&
          renderedBlocks[renderedBlocks.length - 1].character?.portrait && (
            <div className="scene-viewer-portrait">
              <img
                src={new URL(
                  `../assets/portraits/${
                    renderedBlocks[renderedBlocks.length - 1].character.portrait
                  }`,
                  import.meta.url
                ).href}
                alt={
                  renderedBlocks[renderedBlocks.length - 1].character.name
                }
              />
            </div>
          )}

        {renderedBlocks.map((block, idx) => {
          switch (block.type) {
            case "singleParagraph":
              return <p key={idx}>{block.text}</p>;

            case "multipleParagraphs":
              return block.text.map((t, tIdx) => (
                <p key={`${idx}-${tIdx}`}>{t}</p>
              ));

            case "characterDialogue":
              return (
                <div key={idx}>
                  <strong>{block.character.name}</strong>
                  {block.text.map((line, lIdx) => (
                    <p key={`${idx}-${lIdx}`}>{line}</p>
                  ))}
                </div>
              );

            case "dialogueChoice":
              return (
                <ol key={idx}>
                  {block.choices.map((choice) => (
                    <li key={choice.id}>
                      <button onClick={() => handleChoice(choice)}>
                        {choice.text}
                      </button>
                    </li>
                  ))}
                </ol>
              );

            default:
              return null;
          }
        })}

        {!waitingChoice && queue.length > 0 && (
          <button onClick={renderNext}>Continue</button>
        )}
      </div>
    </div>
  );
}