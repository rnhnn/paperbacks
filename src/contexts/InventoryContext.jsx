import { createContext, useContext, useState } from "react";
import itemsData from "../data/items.json"; // single source of all items

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  // state: items with their current acquired status
  const [items, setItems] = useState(() =>
    itemsData.map((item) => ({ ...item, acquired: !!item.acquired }))
  );

  // Add an item by ID if not already acquired
  const addItem = (itemId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, acquired: true } : i
      )
    );
  };

  // Remove an item by ID
  const removeItem = (itemId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, acquired: false } : i
      )
    );
  };

  // list of acquired item IDs
  const inventory = items.filter((i) => i.acquired).map((i) => i.id);

  return (
    <InventoryContext.Provider
      value={{
        items,
        inventory,
        addItem,
        removeItem,
        setItems, // 🟢 Exposed for SaveSystem to restore inventory from snapshots
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

// Hook to access inventory from any component
export const useInventory = () => useContext(InventoryContext);