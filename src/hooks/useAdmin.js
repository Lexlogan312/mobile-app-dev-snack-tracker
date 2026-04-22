import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAdmin = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AuthProvider');
  }
  return context;
};
