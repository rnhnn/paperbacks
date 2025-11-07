// Drive the narrative flow by delegating logic and rendering subcomponents
import { useRef, useMemo } from "react";
import { useText } from "../../hooks/useText";
import { useScrollArrows } from "../../hooks/useScrollArrows";
import { useStoryEngine } from "../../hooks/useStoryEngine";
import StoryFlowContent from "./StoryFlowContent";
import StoryFlowPortrait from "./StoryFlowPortrait";
import StoryFlowButton from "./StoryFlowButton";
import "../../styles/StoryFlow.css";
import "../../styles/ScrollArrows.css";

export default function StoryFlow({
  story,
  savedStory,
  onStorySnapshot,
  onBegin,
  onAmbienceChange,
  onSFX,
}) {
  const { t, textData } = useText();
  const contentRef = useRef(null);

  // Initialize engine hook to manage narrative logic and state
  const {
    renderedBlocks,
    waitingChoice,
    currentNodeId,
    lastPortraitBlock,
    handleChoice,
    handleBegin,
    renderNext,
    isAutoScrolling,
  } = useStoryEngine({
    story,
    savedStory,
    textData,
    onStorySnapshot,
    onBegin,
    onAmbienceChange,
    onSFX,
    contentRef,
  });

  // Enable arrow navigation tied to autoscroll
  useScrollArrows(contentRef, { step: 24, isAutoScrolling });

  return (
    <div className="story-flow has-scroll-parent">
      {lastPortraitBlock && (
        <StoryFlowPortrait block={lastPortraitBlock} textData={textData} />
      )}
      <StoryFlowContent
        ref={contentRef}
        renderedBlocks={renderedBlocks}
        handleChoice={handleChoice}
        textData={textData}
      />
      <StoryFlowButton
        t={t}
        waitingChoice={waitingChoice}
        currentNodeId={currentNodeId}
        renderedBlocks={renderedBlocks}
        handleBegin={handleBegin}
        renderNext={renderNext}
      />
    </div>
  );
}