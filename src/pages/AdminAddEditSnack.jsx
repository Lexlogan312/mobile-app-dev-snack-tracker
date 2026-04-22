import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Camera, Image as ImageIcon, X, ChevronDown, ChevronUp, Save, Tag, AlertTriangle, ScanBarcode } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import Loader from '../components/common/Loader';
import { useScanner } from '../hooks/useScanner';
import { fetchSnackByBarcode } from '../lib/barcodeScanner';

const CATEGORIES = ["Chips", "Candy", "Drinks", "Healthy", "Bakery", "Misc"];
const ALLERGEN_CONFIG = [
  { name: "peanuts", label: "Peanuts", color: "bg-red-100 border-red-300 text-red-700", activeColor: "bg-red-500 text-white border-red-600" },
  { name: "tree nuts", label: "Tree Nuts", color: "bg-orange-100 border-orange-300 text-orange-700", activeColor: "bg-orange-500 text-white border-orange-600" },
  { name: "milk", label: "Milk", color: "bg-blue-100 border-blue-300 text-blue-700", activeColor: "bg-blue-500 text-white border-blue-600" },
  { name: "wheat", label: "Wheat", color: "bg-amber-100 border-amber-300 text-amber-700", activeColor: "bg-amber-500 text-white border-amber-600" },
  { name: "eggs", label: "Eggs", color: "bg-yellow-100 border-yellow-300 text-yellow-700", activeColor: "bg-yellow-500 text-white border-yellow-600" },
  { name: "soy", label: "Soy", color: "bg-green-100 border-green-300 text-green-700", activeColor: "bg-green-500 text-white border-green-600" },
  { name: "none", label: "None", color: "bg-gray-100 border-gray-300 text-gray-700", activeColor: "bg-gray-500 text-white border-gray-600" }
];

import { useSettings } from '../hooks/useSettings';

const AdminAddEditSnack = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startScan } = useScanner();
  const { globalThreshold } = useSettings();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Chips',
    quantity: 0,
    lowStockThreshold: '',
    description: '',
    storageLocation: "Dr. Stephany's Office",
    tags: [],
    allergens: [],
    barcode: '',
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    }
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [existingImagePath, setExistingImagePath] = useState(null);
  
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchSnack = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'snacks', id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              name: data.name || '',
              category: data.category || 'Chips',
              quantity: data.quantity || 0,
              lowStockThreshold: data.lowStockThreshold !== undefined && data.lowStockThreshold !== null ? data.lowStockThreshold : '',
              description: data.description || '',
              storageLocation: data.storageLocation || "Dr. Stephany's Office",
              tags: data.tags || [],
              allergens: data.allergens || [],
              barcode: data.barcode || '',
              nutritionalInfo: data.nutritionalInfo || {
                calories: '', protein: '', carbs: '', fat: ''
              }
            });
            setExistingImageUrl(data.imageUrl || null);
            setExistingImagePath(data.imagePath || null);
            setImagePreview(data.imageUrl || null);
          } else {
            toast.error("Snack not found");
            navigate('/admin/dashboard');
          }
        } catch (error) {
          toast.error("Error loading snack");
        } finally {
          setLoading(false);
        }
      };
      fetchSnack();
    }
  }, [id, isEdit, navigate]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const barcodeParam = queryParams.get('barcode');
    const nameParam = queryParams.get('name');
    const categoryParam = queryParams.get('category');
    
    if (!isEdit) {
      if (barcodeParam) {
        setFormData(prev => ({ ...prev, barcode: barcodeParam }));
        handleBarcodeLookup(barcodeParam);
      }
      if (nameParam || categoryParam) {
        setFormData(prev => ({
          ...prev,
          name: nameParam || prev.name,
          category: categoryParam || prev.category
        }));
      }
    }
  }, [isEdit]);

  const handleBarcodeLookup = async (barcode) => {
    const toastId = toast.loading('Looking up snack details...');
    const details = await fetchSnackByBarcode(barcode);
    if (details) {
      setFormData(prev => ({
        ...prev,
        name: details.name || prev.name,
        description: details.description || prev.description,
        nutritionalInfo: {
          ...prev.nutritionalInfo,
          ...details.nutritionalInfo
        },
        allergens: [...new Set([...prev.allergens, ...details.allergens])]
      }));
      if (details.imageUrl && !imagePreview) {
        setImagePreview(details.imageUrl);
        setExistingImageUrl(details.imageUrl);
      }
      toast.success('Snack details found!', { id: toastId });
    } else {
      toast.error('Could not find snack details', { id: toastId });
    }
  };

  const handleScanBarcode = () => {
    startScan((barcode) => {
      setFormData(prev => ({ ...prev, barcode }));
      handleBarcodeLookup(barcode);
    });
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleNutritionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      nutritionalInfo: {
        ...prev.nutritionalInfo,
        [name]: value
      }
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleAllergen = (allergen) => {
    setFormData(prev => {
      const current = prev.allergens || [];
      if (current.includes(allergen)) {
        return { ...prev, allergens: current.filter(a => a !== allergen) };
      } else {
        return { ...prev, allergens: [...current, allergen] };
      }
    });
  };

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      setImageFile(blob);
      setImagePreview(image.webPath);
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || formData.quantity === '') {
      toast.error("Please fill required fields");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = existingImageUrl;
      let imagePath = existingImagePath;

      // Handle image upload
      if (imageFile) {
        // Delete old image if exists
        if (existingImagePath) {
          try {
            await deleteObject(ref(storage, existingImagePath));
          } catch (e) { console.error("Error deleting old image", e); }
        }

        const newImagePath = `snacks/${Date.now()}_${imageFile.name || 'photo.jpg'}`;
        const storageRef = ref(storage, newImagePath);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        imagePath = newImagePath;
      } else if (!imagePreview && existingImagePath) {
        // User removed the image
        try {
          await deleteObject(ref(storage, existingImagePath));
        } catch (e) { console.error("Error deleting old image", e); }
        imageUrl = null;
        imagePath = null;
      }

      let finalAllergens = formData.allergens.map(a => a.toLowerCase());
      if (finalAllergens.includes('none')) {
        finalAllergens = [];
      }

      const threshold = formData.lowStockThreshold !== '' && formData.lowStockThreshold !== null 
        ? formData.lowStockThreshold 
        : globalThreshold;

      const snackData = {
        ...formData,
        allergens: finalAllergens,
        imageUrl,
        imagePath,
        isOnShoppingList: formData.quantity <= threshold,
        updatedAt: serverTimestamp()
      };

      if (isEdit) {
        await updateDoc(doc(db, 'snacks', id), snackData);
        toast.success("Snack updated!");
      } else {
        snackData.createdAt = serverTimestamp();
        snackData.timesConsumed = 0;
        await addDoc(collection(db, 'snacks'), snackData);
        toast.success("Snack added!");
      }
      
      navigate('/');
    } catch (error) {
      console.error("Error saving snack:", error);
      toast.error("Failed to save snack");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageWrapper><Loader /></PageWrapper>;

  return (
    <PageWrapper className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display text-[var(--color-text-primary)] tracking-tight">
          {isEdit ? 'Edit Snack' : 'New Snack'}
        </h1>
        <button 
          onClick={() => navigate(-1)}
          className="text-[var(--color-text-secondary)] font-bold hover:text-[var(--color-primary)] transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 rounded-3xl overflow-hidden bg-[var(--color-primary-soft)] border-2 border-dashed border-[var(--color-primary-light)] flex items-center justify-center">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </>
            ) : (
              <div className="text-center text-[var(--color-primary-light)] p-4">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">No Image</span>
              </div>
            )}
          </div>
          <div className="flex space-x-3 mt-4">
            <button 
              type="button"
              onClick={handleTakePhoto}
              className="px-4 py-2 bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold rounded-xl flex items-center space-x-2 hover:bg-[var(--color-primary-glow)] transition-colors"
            >
              <Camera size={18} />
              <span>Camera</span>
            </button>
            <label className="px-4 py-2 bg-white border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold rounded-xl flex items-center space-x-2 cursor-pointer shadow-sm hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors">
              <ImageIcon size={18} />
              <span>Gallery</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Barcode</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
                placeholder="Scan or type barcode"
              />
              <button 
                type="button"
                onClick={handleScanBarcode}
                className="px-4 py-3 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-glow)] transition-colors flex items-center justify-center"
              >
                <ScanBarcode size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Name *</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
              placeholder="e.g. Doritos Nacho Cheese"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Category *</label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Quantity *</label>
              <input 
                type="number" 
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Low Stock At</label>
              <input 
                type="number" 
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                min="0"
                placeholder={`Default: ${globalThreshold}`}
                className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Tags & Allergens */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] mb-2">
              <Tag size={16} /> Tags
            </label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {formData.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-lg text-sm font-bold">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-[var(--color-primary-light)]">
                    <X size={14} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                placeholder="Add a tag (e.g., spicy, vegan)"
                className="flex-1 px-4 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-medium text-[var(--color-text-primary)] transition-all"
              />
              <button 
                type="button" 
                onClick={handleAddTag}
                className="px-4 py-2 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-light)] transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] mb-3">
              <AlertTriangle size={16} className="text-red-500" /> Allergens
            </label>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_CONFIG.map(config => {
                const isSelected = formData.allergens?.includes(config.name);
                return (
                  <button
                    key={config.name}
                    type="button"
                    onClick={() => toggleAllergen(config.name)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      isSelected 
                        ? config.activeColor 
                        : config.color + ' opacity-60 hover:opacity-100'
                    }`}
                  >
                    {config.name === 'none' ? 'Allergen-Free ✅' : config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-medium text-[var(--color-text-primary)] resize-none transition-all"
              placeholder="A little bit about this snack..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Storage Location</label>
            <input 
              type="text" 
              name="storageLocation"
              value={formData.storageLocation}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
              placeholder="e.g. Cabinet 2, Fridge"
            />
          </div>
        </div>

        {/* Nutrition */}
        <div className="bg-white rounded-3xl shadow-sm border border-[var(--color-border)] overflow-hidden">
          <button 
            type="button"
            onClick={() => setShowNutrition(!showNutrition)}
            className="w-full p-6 flex justify-between items-center font-display text-lg text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors"
          >
            <span>Nutritional Info (Optional)</span>
            {showNutrition ? <ChevronUp size={24} className="text-[var(--color-primary)]" /> : <ChevronDown size={24} className="text-[var(--color-text-secondary)]" />}
          </button>
          
          {showNutrition && (
            <div className="p-6 pt-0 border-t-2 border-[var(--color-border)] grid grid-cols-2 gap-4 mt-4">
              {['calories', 'protein', 'carbs', 'fat'].map(field => (
                <div key={field}>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">{field}</label>
                  <input 
                    type="text" 
                    name={field}
                    value={formData.nutritionalInfo[field]}
                    onChange={handleNutritionChange}
                    className="w-full px-4 py-2 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:ring-4 focus:ring-[var(--color-primary-glow)] focus:border-[var(--color-primary)] outline-none font-bold text-[var(--color-text-primary)] transition-all"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-[var(--color-primary)] text-white font-bold text-xl rounded-2xl shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:bg-[var(--color-primary-light)] transition-all disabled:opacity-70 flex justify-center items-center"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <div className="flex items-center space-x-2">
              <Save size={24} />
              <span>Save Snack</span>
            </div>
          )}
        </button>
      </form>
    </PageWrapper>
  );
};

export default AdminAddEditSnack;
