import WindowOverlay from "./WindowOverlay";
import "../styles/Inventory.css";

export default function Inventory({ items, onClose }) {
  return (
    <WindowOverlay onClose={onClose}>
      <div className="window window-inventory">
        <button className="window-close" onClick={onClose}>×</button>
        <h2 className="window-title">Inventory</h2>

        {items.length > 0 ? (
          <ul className="inventory-list">
            {items.map((item) => (
              <li key={item.id} className="inventory-item">
                <h3 className="inventory-list-item-title">{item.name || "No name"}</h3>
                {item.description && <p className="inventory-list-item-description">({item.description})</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No items yet.</p>
        )}
      </div>
    </WindowOverlay>
  );
}