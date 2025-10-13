// Inventory window displaying all acquired items
import { useMemo } from "react";
import WindowOverlay from "./WindowOverlay";
import useText from "../hooks/useText";
import "../styles/Inventory.css";

export default function Inventory({ items, onClose }) {
  const { t, textData } = useText();

  // Build a quick lookup for localized items by id
  const localizedById = useMemo(() => {
    const map = Object.create(null);
    for (const it of textData.items) map[it.id] = it;
    return map;
  }, [textData.items]);

  // Render a modal showing the player’s current inventory
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-inventory">
        {/* Close button in the top-right corner */}
        <button className="window-close" onClick={onClose}>
          ×
        </button>

        <h2 className="window-title">{t("ui.inventoryWindow.title")}</h2>

        {/* List all acquired items or show an empty message */}
        {items.length > 0 ? (
          <ul className="inventory-list">
            {items.map((item) => {
              // Prefer localized text if available, fall back to base
              const loc = localizedById[item.id] || item;

              return (
                <li key={item.id} className="inventory-item">
                  <h3 className="inventory-list-item-title">
                    {loc.name || t("ui.inventoryWindow.noName")}
                  </h3>
                  {loc.description && (
                    <p className="inventory-list-item-description">
                      ({loc.description})
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{t("ui.inventoryWindow.empty")}</p>
        )}
      </div>
    </WindowOverlay>
  );
}