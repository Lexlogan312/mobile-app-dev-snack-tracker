import React, { useContext } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { FavoritesContext } from '../../context/FavoritesContext';
import toast from 'react-hot-toast';

const FavoriteButton = ({ snackId, className = '' }) => {
  const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
  const favorite = isFavorite(snackId);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(snackId);
    if (!favorite) {
      toast('Added to favorites');
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={handleToggle}
      className={`p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-colors ${className}`}
    >
      <Heart 
        size={20} 
        className={favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} 
      />
    </motion.button>
  );
};

export default FavoriteButton;
