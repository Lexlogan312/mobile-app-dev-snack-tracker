import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { ArrowLeft, Edit2, Info, Calendar, MapPin, Package, Utensils, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import QuantityBadge from '../components/snacks/QuantityBadge';
import FavoriteButton from '../components/snacks/FavoriteButton';
import { useAdmin } from '../hooks/useAdmin';
import { useConsumptionLog } from '../hooks/useConsumptionLog';
import { format } from 'date-fns';

const ALLERGEN_CONFIG = {
  "peanuts": "bg-red-100 text-red-700 border-red-200",
  "tree nuts": "bg-orange-100 text-orange-700 border-orange-200",
  "milk": "bg-blue-100 text-blue-700 border-blue-200",
  "dairy": "bg-blue-100 text-blue-700 border-blue-200",
  "wheat": "bg-amber-100 text-amber-700 border-amber-200",
  "gluten": "bg-amber-100 text-amber-700 border-amber-200",
  "eggs": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "soy": "bg-green-100 text-green-700 border-green-200",
  "none": "bg-gray-100 text-gray-700 border-gray-200"
};

import { useSettings } from '../hooks/useSettings';

const SnackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { logConsumption } = useConsumptionLog();
  const { globalThreshold } = useSettings();
  
  const [snack, setSnack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEating, setIsEating] = useState(false);

  useEffect(() => {
    const fetchSnack = async () => {
      try {
        const docRef = doc(db, 'snacks', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSnack({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Snack not found");
        }
      } catch (error) {
        console.error("Error fetching snack:", error);
        toast.error("Failed to load snack details");
      } finally {
        setLoading(false);
      }
    };

    fetchSnack();
  }, [id]);

  const handleEatOne = async () => {
    if (!snack || snack.quantity <= 0 || isEating) return;
    
    setIsEating(true);
    try {
      const newQuantity = snack.quantity - 1;
      const newTimesConsumed = (snack.timesConsumed || 0) + 1;
      const threshold = snack.lowStockThreshold !== undefined && snack.lowStockThreshold !== null && snack.lowStockThreshold !== '' 
        ? snack.lowStockThreshold 
        : globalThreshold;
      const isOnShoppingList = newQuantity <= threshold;

      const snackRef = doc(db, 'snacks', snack.id);
      
      await updateDoc(snackRef, {
        quantity: newQuantity,
        timesConsumed: newTimesConsumed,
        isOnShoppingList: isOnShoppingList,
        updatedAt: serverTimestamp()
      });

      // Log consumption
      await logConsumption(snack.id, snack.name);

      // If it just hit the threshold, add to shopping list
      if (isOnShoppingList && !snack.isOnShoppingList) {
        await addDoc(collection(db, 'shoppingList'), {
          snackId: snack.id,
          name: snack.name,
          isPurchased: false,
          addedAt: serverTimestamp(),
          priority: newQuantity <= 0 ? 'urgent' : 'soon'
        });
      }

      setSnack(prev => ({
        ...prev,
        quantity: newQuantity,
        timesConsumed: newTimesConsumed,
        isOnShoppingList: isOnShoppingList
      }));

      toast('Enjoy your snack! 🦆', { icon: '🦆' });
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      setIsEating(false);
    }
  };

  if (loading) return <PageWrapper noPadding><Loader /></PageWrapper>;
  if (!snack) return <PageWrapper noPadding><EmptyState title="Snack Not Found" message="This snack might have been deleted." icon={<Package size={40} strokeWidth={1.5} />} /></PageWrapper>;

  return (
    <PageWrapper noPadding>
      <div className="relative h-72 bg-[var(--color-primary-soft)] rounded-b-[40px] overflow-hidden shadow-sm">
        {snack.imageUrl ? (
          <img 
            src={snack.imageUrl} 
            alt={snack.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={80} className="text-[var(--color-primary-light)] opacity-50" strokeWidth={1.5} />
          </div>
        )}
        
        <div className="absolute top-0 pt-safe-top mt-4 left-4 right-4 flex justify-between items-center z-10">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--color-text-primary)]" />
          </button>
          
          <div className="flex space-x-2">
            <FavoriteButton snackId={snack.id} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors" />
            {isAdmin && (
              <Link 
                to={`/admin/snack/${snack.id}/edit`}
                className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-[var(--color-primary)] hover:bg-white transition-colors"
              >
                <Edit2 size={20} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-8 pb-24 max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-4xl font-display text-[var(--color-text-primary)] leading-tight">{snack.name}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-3 py-1 rounded-xl uppercase tracking-wider border border-[var(--color-primary-glow)]">
            {snack.category}
          </span>
          <QuantityBadge quantity={snack.quantity} className="text-sm px-3 py-1" />
          {snack.tags && snack.tags.map(tag => (
            <span key={tag} className="text-sm font-bold text-[var(--color-secondary)] bg-pink-50 px-3 py-1 rounded-xl border border-pink-100">
              #{tag}
            </span>
          ))}
        </div>

        {snack.allergens && snack.allergens.length > 0 && !snack.allergens.includes('none') && (
          <div className="mb-8 bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-orange-500" size={20} />
              <h3 className="text-[var(--color-text-primary)] font-bold">Allergen Information</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {snack.allergens.map(allergen => (
                <span 
                  key={allergen} 
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${ALLERGEN_CONFIG[allergen] || 'bg-gray-100 text-gray-700 border-gray-200'} capitalize`}
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {snack.allergens && snack.allergens.includes('none') && (
          <div className="mb-8 bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full text-green-600">
              <CheckCircle size={20} />
            </div>
            <span className="font-bold text-green-800">Allergen-Free ✅</span>
          </div>
        )}

        {snack.description && (
          <div className="mb-8">
            <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-2">About</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed font-medium">{snack.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          {snack.storageLocation && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)] flex items-start space-x-3">
              <div className="p-2 bg-green-50 rounded-xl text-green-600">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Location</p>
                <p className="font-bold text-[var(--color-text-primary)]">{snack.storageLocation}</p>
              </div>
            </div>
          )}
          
          {snack.expirationDate && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)] flex items-start space-x-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Expires</p>
                <p className="font-bold text-[var(--color-text-primary)]">
                  {format(snack.expirationDate.toDate(), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>

        {snack.nutritionalInfo && Object.keys(snack.nutritionalInfo).length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--color-border)] mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Info size={24} className="text-[var(--color-primary)]" />
              <h3 className="text-xl font-display text-[var(--color-text-primary)]">Nutrition Facts</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {Object.entries(snack.nutritionalInfo).map(([key, value]) => {
                if (!value) return null;
                return (
                  <div key={key} className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[var(--color-text-secondary)] font-medium capitalize">{key}</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEatOne}
          disabled={snack.quantity <= 0 || isEating}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-sm transition-all flex items-center justify-center space-x-2 ${
            snack.quantity > 0 
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] shadow-[0_4px_14px_rgba(124,58,237,0.3)]' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Utensils size={20} />
          <span>I ate one!</span>
        </motion.button>
      </div>
    </PageWrapper>
  );
};

export default SnackDetail;
