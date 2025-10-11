import WindowOverlay from "./WindowOverlay";
import "../styles/Inventory.css";

export default function Inventory({ items, onClose }) {
  return (
    <WindowOverlay onClose={onClose}>
      <div className="inventory-window">
        <button className="window-close" onClick={onClose}>×</button>
        <h2>Inventory</h2>

        {items.length > 0 ? (
          <ul className="inventory-list">
            {items.map((item) => (
              <li key={item.id} className="inventory-item">
                <strong>{item.name || "No name"}</strong>
                {item.description && <p>({item.description})</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="inventory-empty">No items yet.</p>
        )}
      </div>
    </WindowOverlay>
  );
}