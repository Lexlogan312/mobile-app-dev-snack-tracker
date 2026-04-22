import React, { createContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const ShoppingListContext = createContext();

export const ShoppingListProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'shoppingList'), orderBy('priority', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching shopping list:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ShoppingListContext.Provider value={{ items, loading }}>
      {children}
    </ShoppingListContext.Provider>
  );
};
