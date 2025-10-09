import { useEffect, useCallback } from 'react';

interface BarcodeScannerConfig {
  debounceTime: number;
  minLength: number;
  maxLength: number;
  allowedCharacters: RegExp;
}

const defaultConfig: BarcodeScannerConfig = {
  debounceTime: 100,
  minLength: 8,
  maxLength: 20,
  allowedCharacters: /^[0-9]+$/,
};

export const useBarcodeScanner = (
  onBarcode: (barcode: string) => void,
  config: Partial<BarcodeScannerConfig> = {}
) => {
  const mergedConfig = { ...defaultConfig, ...config };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only process if we're not in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const key = event.key;

    // Handle Enter key to process barcode
    if (key === 'Enter') {
      const barcode = getBarcodeFromBuffer();
      if (barcode && barcode.length >= mergedConfig.minLength && 
          barcode.length <= mergedConfig.maxLength) {
        onBarcode(barcode);
        clearBarcodeBuffer();
      }
      return;
    }

    // Handle backspace
    if (key === 'Backspace') {
      removeLastCharacterFromBuffer();
      return;
    }

    // Add character to buffer if it matches allowed characters
    if (mergedConfig.allowedCharacters.test(key)) {
      addCharacterToBuffer(key);
    }
  }, [onBarcode, mergedConfig]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Global barcode buffer (in a real app, this would be in a context or store)
let barcodeBuffer = '';
let bufferTimeout: NodeJS.Timeout | null = null;

const addCharacterToBuffer = (char: string) => {
  barcodeBuffer += char;
  
  // Clear timeout if it exists
  if (bufferTimeout) {
    clearTimeout(bufferTimeout);
  }
  
  // Set timeout to clear buffer if no more input
  bufferTimeout = setTimeout(() => {
    clearBarcodeBuffer();
  }, 100); // 100ms debounce
};

const removeLastCharacterFromBuffer = () => {
  barcodeBuffer = barcodeBuffer.slice(0, -1);
};

const getBarcodeFromBuffer = (): string => {
  return barcodeBuffer.trim();
};

const clearBarcodeBuffer = () => {
  barcodeBuffer = '';
  if (bufferTimeout) {
    clearTimeout(bufferTimeout);
    bufferTimeout = null;
  }
};

// Hook for manual barcode scanning (e.g., from a scanner device)
export const useManualBarcodeScanner = (
  onBarcode: (barcode: string) => void
) => {
  const scanBarcode = useCallback((barcode: string) => {
    if (barcode && barcode.trim().length > 0) {
      onBarcode(barcode.trim());
    }
  }, [onBarcode]);

  return { scanBarcode };
};

// Hook for camera-based barcode scanning
export const useCameraBarcodeScanner = (
  onBarcode: (barcode: string) => void,
  onError?: (error: string) => void
) => {
  const startScanning = useCallback(async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Create canvas for barcode detection
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Start scanning loop
      const scanLoop = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);

          // Here you would integrate with a barcode detection library
          // like QuaggaJS, ZXing, or similar
          // For now, we'll just continue the loop
          requestAnimationFrame(scanLoop);
        } else {
          requestAnimationFrame(scanLoop);
        }
      };

      scanLoop();

      // Return cleanup function
      return () => {
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Camera access failed';
      onError?.(errorMessage);
    }
  }, [onBarcode, onError]);

  return { startScanning };
};

// Hook for testing barcode scanning
export const useTestBarcodeScanner = (
  onBarcode: (barcode: string) => void
) => {
  const simulateBarcode = useCallback((barcode: string) => {
    onBarcode(barcode);
  }, [onBarcode]);

  return { simulateBarcode };
};