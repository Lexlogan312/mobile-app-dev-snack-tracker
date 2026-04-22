import React, { createContext, useState, useCallback } from 'react';
import WebScannerModal from '../components/common/WebScannerModal';
import { scanBarcode as nativeScanBarcode } from '../lib/barcodeScanner';

export const ScannerContext = createContext();

export const ScannerProvider = ({ children }) => {
  const [isWebScannerOpen, setIsWebScannerOpen] = useState(false);
  const [onScanCallback, setOnScanCallback] = useState(null);

  const startScan = useCallback(async (callback) => {
    const result = await nativeScanBarcode();
    if (result === 'WEB_SCANNER') {
      setOnScanCallback(() => callback);
      setIsWebScannerOpen(true);
    } else if (result) {
      callback(result);
    }
  }, []);

  const handleWebScan = useCallback((barcode) => {
    if (onScanCallback) {
      onScanCallback(barcode);
    }
    setIsWebScannerOpen(false);
  }, [onScanCallback]);

  return (
    <ScannerContext.Provider value={{ startScan }}>
      {children}
      <WebScannerModal 
        isOpen={isWebScannerOpen} 
        onClose={() => setIsWebScannerOpen(false)} 
        onScan={handleWebScan} 
      />
    </ScannerContext.Provider>
  );
};
