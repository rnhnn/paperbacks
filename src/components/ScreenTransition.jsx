// Render a black fade overlay when active
export default function ScreenTransition({ active }) {
  return <div className={`screen-transition ${active ? "is-active" : ""}`} />;
}
