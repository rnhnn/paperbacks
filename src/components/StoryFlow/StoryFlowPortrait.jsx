// Display the portrait of the most recent speaking character in StoryFlow
import { resolveCharacter } from "./storyFlowHelpers";

export default function StoryFlowPortrait({ block, textData }) {
  const { characters } = textData;
  const char =
    block._frozenCharacter ||
    resolveCharacter(block.character, characters);

  if (!char?.portrait) return null;

  return (
    <div className="story-flow-portrait">
      <img src={`/assets/portraits/${char.portrait}`} alt={char.name} />
    </div>
  );
}