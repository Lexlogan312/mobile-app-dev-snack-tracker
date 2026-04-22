import { useContext } from 'react';
import { ScannerContext } from '../context/ScannerContext';

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};
