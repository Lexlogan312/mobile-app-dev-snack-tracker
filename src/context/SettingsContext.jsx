import React, { createContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [globalThreshold, setGlobalThreshold] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubThreshold = onSnapshot(doc(db, 'settings', 'globalThreshold'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalThreshold(docSnap.data().value);
      }
      setLoading(false);
    });

    return () => {
      unsubThreshold();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ globalThreshold, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
