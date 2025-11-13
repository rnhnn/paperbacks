// Display a fullscreen black fade overlay during screen transitions

export default function ScreenTransition({ active }) {
  return <div className={`screen-transition ${active ? "is-active" : ""}`} />;
}