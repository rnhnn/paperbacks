// Render the Begin or Continue button for StoryFlow progression
export default function StoryFlowButton({
  t,
  waitingChoice,
  currentNodeId,
  renderedBlocks,
  handleBegin,
  renderNext,
}) {
  // Hide when waiting for a choice or story ended
  if (waitingChoice || currentNodeId === null) return null;

  const isStart = renderedBlocks.length === 0;
  const label = isStart ? t("ui.storyFlow.begin") : t("ui.storyFlow.continue");
  const onClick = isStart ? handleBegin : renderNext;

  return (
    <div className="story-flow-button-area">
      <button onClick={onClick} className="story-flow-button">
        {label}
      </button>
    </div>
  );
}