import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

export const scanBarcode = async () => {
  if (!Capacitor.isNativePlatform()) {
    // Return a special string to indicate we should use the web scanner modal
    return 'WEB_SCANNER';
  }

  try {
    // Request permissions
    const { camera } = await BarcodeScanner.requestPermissions();
    if (camera !== 'granted' && camera !== 'limited') {
      toast.error('Camera permission is required to scan barcodes');
      return null;
    }

    // Start scanning
    const { barcodes } = await BarcodeScanner.scan();
    if (barcodes && barcodes.length > 0) {
      return barcodes[0].rawValue;
    }
    return null;
  } catch (error) {
    console.error('Barcode scanning error:', error);
    toast.error('Failed to scan barcode');
    return null;
  }
};

export const fetchSnackByBarcode = async (barcode) => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      const p = data.product;
      return {
        name: p.product_name || '',
        description: p.generic_name || '',
        imageUrl: p.image_url || '',
        nutritionalInfo: {
          calories: p.nutriments?.energy_kcal_100g ? Math.round(p.nutriments.energy_kcal_100g) : '',
          protein: p.nutriments?.proteins_100g ? `${Math.round(p.nutriments.proteins_100g)}g` : '',
          carbs: p.nutriments?.carbohydrates_100g ? `${Math.round(p.nutriments.carbohydrates_100g)}g` : '',
          fat: p.nutriments?.fat_100g ? `${Math.round(p.nutriments.fat_100g)}g` : ''
        },
        allergens: p.allergens_tags ? p.allergens_tags.map(a => a.replace('en:', '')) : []
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return null;
  }
};
