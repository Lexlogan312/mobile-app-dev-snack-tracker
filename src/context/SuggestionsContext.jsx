import React, { createContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const SuggestionsContext = createContext();

export const SuggestionsProvider = ({ children }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'suggestions';
    const q = query(collection(db, path), orderBy('upvotes', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuggestions(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching suggestions:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SuggestionsContext.Provider value={{ suggestions, loading }}>
      {children}
    </SuggestionsContext.Provider>
  );
};
