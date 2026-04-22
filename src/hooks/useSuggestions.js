import { useContext } from 'react';
import { SuggestionsContext } from '../context/SuggestionsContext';

export const useSuggestions = () => {
  const context = useContext(SuggestionsContext);
  if (!context) {
    throw new Error('useSuggestions must be used within a SuggestionsProvider');
  }
  return context;
};
