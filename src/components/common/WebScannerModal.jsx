import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const WebScannerModal = ({ isOpen, onClose, onScan }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const cameraIdRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Prefer back camera
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear')
          );
          const selectedCameraId = backCamera ? backCamera.id : devices[0].id;
          cameraIdRef.current = selectedCameraId;

          await html5QrCode.start(
            selectedCameraId,
            {
              fps: 15,
              aspectRatio: 1.0
            },
            (decodedText) => {
              onScan(decodedText);
              stopScanner();
              onClose();
            },
            (errorMessage) => {
              // Ignore constant scanning errors
            }
          );
          setIsCameraReady(true);
          setError(null);
        } else {
          setError("No cameras found on this device.");
        }
      } catch (err) {
        console.error("Camera start error:", err);
        setError("Failed to access camera. Please ensure permissions are granted.");
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsCameraReady(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsCameraReady(false);
    // Re-trigger useEffect by toggling isOpen or just re-calling logic
    // For simplicity, we can just rely on the user closing and reopening if it fails hard
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] p-6 shadow-2xl border border-[var(--color-border)] w-full max-w-md relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-lg">
                  <Camera size={20} />
                </div>
                <h2 className="text-xl font-display text-[var(--color-text-primary)]">Barcode Scanner</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="relative aspect-square w-full bg-black rounded-2xl overflow-hidden border-2 border-[var(--color-border)]">
              <div id="reader" className="w-full h-full"></div>
              
              {!isCameraReady && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                  <RefreshCw className="animate-spin mb-2" size={32} />
                  <p className="text-sm font-bold">Initializing camera...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                  <p className="text-sm font-bold text-red-400 mb-4">{error}</p>
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {isCameraReady && !error && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[150px] border-2 border-[var(--color-primary)] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[var(--color-primary)] -translate-x-1 -translate-y-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[var(--color-primary)] translate-x-1 -translate-y-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[var(--color-primary)] -translate-x-1 translate-y-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[var(--color-primary)] translate-x-1 translate-y-1"></div>
                    
                    <motion.div 
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-2">
              <p className="text-center text-[var(--color-text-primary)] font-bold">
                Point at a barcode
              </p>
              <p className="text-center text-[var(--color-text-secondary)] text-sm font-medium">
                Hold your device steady and ensure good lighting
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WebScannerModal;
