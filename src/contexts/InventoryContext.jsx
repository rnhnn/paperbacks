// Provide global inventory state: acquired items, item mutations, and restoration support

// React
import { createContext, useContext, useState } from "react";

// Data
import itemsData from "../data/items.json";

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  // Initialize item state from items.json, marking each with its acquired status and unseen state
  const [items, setItems] = useState(() =>
    itemsData.map((item) => ({
      ...item,
      acquired: !!item.acquired,
      seen: false, // Track whether the player has viewed this item in the inventory
    }))
  );

  // Mark an item as acquired by its ID if not already obtained
  const addItem = (itemId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, acquired: true } : i
      )
    );
  };

  // Mark an item as removed or lost by its ID
  const removeItem = (itemId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, acquired: false } : i
      )
    );
  };

  // Mark an item as seen when the player has viewed it in the inventory
  const markItemSeen = (itemId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, seen: true } : i
      )
    );
  };

  // Compute a derived list of acquired item IDs for quick access
  const inventory = items.filter((i) => i.acquired).map((i) => i.id);

  // Provide the inventory state and mutators to all child components
  return (
    <InventoryContext.Provider
      value={{
        items, // Full list of item objects
        inventory, // List of acquired item IDs
        addItem, // Add item by ID
        removeItem, // Remove item by ID
        markItemSeen, // Mark item as seen by ID
        setItems, // Used internally by SaveSystem to restore inventory state
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

// Hook for convenient access to the inventory system
export const useInventory = () => useContext(InventoryContext);