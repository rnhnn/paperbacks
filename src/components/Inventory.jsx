// Inventory window displaying all acquired items
import WindowOverlay from "./WindowOverlay";
import useText from "../hooks/useText";
import "../styles/Inventory.css";

export default function Inventory({ items, onClose }) {
  const { t } = useText();

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
            {items.map((item) => (
              <li key={item.id} className="inventory-item">
                <h3 className="inventory-list-item-title">
                  {item.name || t("ui.inventoryWindow.noName")}
                </h3>
                {item.description && (
                  <p className="inventory-list-item-description">
                    ({item.description})
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("ui.inventoryWindow.empty")}</p>
        )}
      </div>
    </WindowOverlay>
  );
}