import React, { createContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const SnacksContext = createContext();

export const SnacksProvider = ({ children }) => {
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const path = 'snacks';
    const q = query(collection(db, path), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const snacksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSnacks(snacksData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching snacks:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refresh = async () => {
    // onSnapshot is real-time, but we can provide a manual refresh 
    // that just resolves after a short delay to satisfy the UI interaction
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <SnacksContext.Provider value={{ snacks, loading, error, refresh }}>
      {children}
    </SnacksContext.Provider>
  );
};
