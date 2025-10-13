// Load React hooks
import { useMemo } from "react";
import { useFlags } from "../contexts/FlagsContext";

// Load all base (English) text data
import uiEn from "../data/ui.json";
import storyEn from "../data/story.json";
import itemsEn from "../data/items.json";
import notesEn from "../data/notes.json";
import charactersEn from "../data/characters.json";

// Load translation overlays (only Spanish for now)
import uiEs from "../data/translations/es-ui.json";
import storyEs from "../data/translations/es-story.json";
import itemsEs from "../data/translations/es-items.json";
import notesEs from "../data/translations/es-notes.json";
import charactersEs from "../data/translations/es-characters.json";

// Map available languages and their datasets
const LANG_MAP = {
  en: { ui: uiEn, story: storyEn, items: itemsEn, notes: notesEn, characters: charactersEn },
  es: { ui: uiEs, story: storyEs, items: itemsEs, notes: notesEs, characters: charactersEs },
};

// Get value by dot path (e.g., "mainMenu.title" or "nodes.lonelyStreet.text")
function getDeepValue(obj, path) {
  const parts = path.split(".");
  let current = obj;
  for (const p of parts) {
    if (current == null) return undefined;
    current = current[p];
  }
  return current;
}

// Apply translation overlay onto base object (non-destructive)
function applyTranslation(base, overlay) {
  if (!overlay) return base;
  const localized = structuredClone(base);

  for (const [path, value] of Object.entries(overlay)) {
    const parts = path.split(".");
    let target = localized;
    while (parts.length > 1) {
      const key = parts.shift();

      // Find node by ID in arrays of objects (e.g., story.nodes)
      if (Array.isArray(target)) {
        const byId = target.find((el) => el.id === key);
        target = byId ?? target[Number(key)];
      } else {
        target = target[key];
      }

      if (!target) break;
    }

    const finalKey = parts[0];
    if (target && finalKey in target) {
      target[finalKey] = value;
    }
  }

  return localized;
}

export default function useText() {
  const { language = "en" } = useFlags(); // Read selected language from context

  // Build localized datasets for all content types
  const textData = useMemo(() => {
    const base = LANG_MAP.en;
    const overlay = LANG_MAP[language];

    return {
      ui: applyTranslation(base.ui, overlay.ui),
      story: applyTranslation(base.story, overlay.story),
      items: applyTranslation(base.items, overlay.items),
      notes: applyTranslation(base.notes, overlay.notes),
      characters: applyTranslation(base.characters, overlay.characters),
    };
  }, [language]);

  // Resolve a text key like "ui.mainMenu.title"
  const t = (path) => {
    const [section, ...rest] = path.split(".");
    const sectionData = textData[section];
    if (!sectionData) return path;
    const value = getDeepValue(sectionData, rest.join("."));
    return value ?? path;
  };

  // Return translation helper, current language, and localized datasets
  return { t, language, textData };
}