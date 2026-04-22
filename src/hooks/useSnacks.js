import { useContext } from 'react';
import { SnacksContext } from '../context/SnacksContext';

export const useSnacks = () => {
  const context = useContext(SnacksContext);
  if (!context) {
    throw new Error('useSnacks must be used within a SnacksProvider');
  }
  return context;
};
