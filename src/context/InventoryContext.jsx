import { createContext, useContext, useState } from "react";
import startingItems from "../data/items/startingItems.json"; // <-- starting items JSON

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  // inventory stores only item IDs, initialized with starting items
  const [inventory, setInventory] = useState([...startingItems]);

  // Add an item by ID if not already in inventory
  const addItem = (itemId) => {
    setInventory((prev) => {
      if (!prev.includes(itemId)) return [...prev, itemId];
      return prev;
    });
  };

  // Remove an item by ID
  const removeItem = (itemId) => {
    setInventory((prev) => prev.filter((i) => i !== itemId));
  };

  return (
    <InventoryContext.Provider value={{ inventory, addItem, removeItem }}>
      {children}
    </InventoryContext.Provider>
  );
};

// Hook to access inventory from any component
export const useInventory = () => useContext(InventoryContext);