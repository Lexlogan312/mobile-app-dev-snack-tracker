import React, { createContext, useState, useEffect } from 'react';

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('snack_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('snack_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (snackId) => {
    setFavorites((prev) =>
      prev.includes(snackId)
        ? prev.filter((id) => id !== snackId)
        : [...prev, snackId]
    );
  };

  const isFavorite = (snackId) => favorites.includes(snackId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};
