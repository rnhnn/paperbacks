// Detect whether debug mode should be active
// Enabled automatically in local dev, or via ?debug=1 in URL
export function isDebugMode() {
  const isDevBuild = import.meta.env.DEV; // True during Vite dev server
  const hasDebugParam = window.location.search.includes("debug=1");
  return isDevBuild || hasDebugParam;
}