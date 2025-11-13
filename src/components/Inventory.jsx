// Display the inventory window with a fixed grid, item selection, and localized descriptions

// Styles
import "../styles/Inventory.css";

// React
import { useState, useMemo } from "react";

// Components
import WindowOverlay from "./WindowOverlay";

// Hooks
import useText from "../hooks/useText";

// Helpers
import { isDebugMode } from "../helpers/isDebugMode";

const GRID_SLOTS = 18; // 2 rows x 9 columns

export default function Inventory({ items, onClose }) {
  const { t, textData } = useText();

  // Build quick lookup for localized items by id
  const localizedById = useMemo(() => {
    const map = Object.create(null);
    for (const it of textData.items) map[it.id] = it;
    return map;
  }, [textData.items]);

  // Filter and sort acquired items (newest first)
  const acquired = useMemo(() => {
    const active = items.filter((it) => it.acquired);
    const sorted = active.reverse();
    if (isDebugMode() && sorted.length > GRID_SLOTS) {
      console.warn(
        `[Inventory] Too many items (${sorted.length}). Showing latest ${GRID_SLOTS}.`
      );
    }
    return sorted.slice(0, GRID_SLOTS);
  }, [items]);

  // Fill fixed grid with items + placeholders
  const gridSlots = useMemo(() => {
    const slots = Array(GRID_SLOTS).fill(null);
    for (let i = 0; i < acquired.length; i++) slots[i] = acquired[i];
    return slots;
  }, [acquired]);

  // Track selected item index
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get selected item (newest by default)
  const selectedItem = gridSlots[selectedIndex] || null;

  // Handle clicking a slot
  const handleSelect = (index) => {
    if (gridSlots[index]) setSelectedIndex(index);
  };

  // Render inventory inside window overlay
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-inventory">
        <h2 className="window-title">{t("ui.inventoryWindow.title")}</h2>

        {/* Split layout into grid (top) and description (bottom) */}
        <div className="inventory-container">
          {/* Top area: item grid */}
          <div className="inventory-grid">
            {acquired.length === 0 ? (
              <p className="inventory-empty">
                {t("ui.inventoryWindow.empty")}
              </p>
            ) : (
              gridSlots.map((item, i) => {
                const isSelected = i === selectedIndex;

                if (!item) {
                  return (
                    <div key={`empty-${i}`} className="inventory-slot empty" />
                  );
                }

                const loc = localizedById[item.id] || item;

                return (
                  <button
                    key={item.id}
                    className={`inventory-slot ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleSelect(i)}
                  >
                    <img
                      src={item.icon}
                      alt={loc.name || item.name}
                      className="inventory-icon"
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom area: description box */}
          <div className="inventory-description">
            {selectedItem ? (
              (() => {
                const loc = localizedById[selectedItem.id] || selectedItem;
                const name = loc.name || selectedItem.name;
                const description =
                  loc.description || selectedItem.description;

                return (
                  <>
                    <h3 className="inventory-name">{name}</h3>
                    {Array.isArray(description)
                      ? description.map((p, i) => (
                          <p
                            key={i}
                            dangerouslySetInnerHTML={{ __html: p }}
                          />
                        ))
                      : description && (
                          <p
                            dangerouslySetInnerHTML={{
                              __html: description,
                            }}
                          />
                        )}
                  </>
                );
              })()
            ) : (
              <p>{t("ui.inventoryWindow.empty")}</p>
            )}
          </div>
        </div>
      </div>
    </WindowOverlay>
  );
}