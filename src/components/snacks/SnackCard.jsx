import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QuantityBadge from './QuantityBadge';
import FavoriteButton from './FavoriteButton';
import { useAdmin } from '../../hooks/useAdmin';
import { useConsumptionLog } from '../../hooks/useConsumptionLog';
import { doc, updateDoc, setDoc, serverTimestamp, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { Utensils } from 'lucide-react';

import { useSettings } from '../../hooks/useSettings';

const SnackCard = ({ snack }) => {
  const { isAdmin } = useAdmin();
  const { logConsumption } = useConsumptionLog();
  const { globalThreshold } = useSettings();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isTaking, setIsTaking] = useState(false);

  const handleTakeOne = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (snack.quantity <= 0 || isTaking) return;
    
    setIsTaking(true);
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

      await logConsumption(snack.id, snack.name);

      if (isOnShoppingList && !snack.isOnShoppingList) {
        await addDoc(collection(db, 'shoppingList'), {
          snackId: snack.id,
          name: snack.name,
          isPurchased: false,
          addedAt: serverTimestamp(),
          priority: newQuantity <= 0 ? 'urgent' : 'soon'
        });
      }

      toast('Yum!', { 
        icon: '😋',
        style: {
          animation: 'bounce 0.5s ease-in-out'
        }
      });
    } catch (error) {
      console.error("Error taking snack:", error);
      toast.error("Failed to take snack");
    } finally {
      setIsTaking(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'snacks', snack.id));
      toast.success('Snack deleted!');
    } catch (error) {
      toast.error('Failed to delete snack');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const hasAllergens = snack.allergens && snack.allergens.length > 0 && !snack.allergens.includes('none');

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-[var(--color-surface)] rounded-[20px] shadow-[0_4px_20px_rgba(124,58,237,0.08)] overflow-hidden border border-[var(--color-border)] flex flex-col h-[220px]"
    >
      <div className="absolute top-2 right-2 z-20">
        <FavoriteButton snackId={snack.id} />
      </div>

      {isAdmin && (
        <div className="absolute top-2 left-2 z-20">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-[var(--color-border)] py-1 min-w-[120px] z-30"
              >
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/admin/snack/${snack.id}/edit`); }}
                  className="w-full flex items-center px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-primary-soft)]"
                >
                  <Edit2 size={14} className="mr-2" /> Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-full flex items-center px-3 py-2 text-sm text-[var(--color-accent-peach)] hover:bg-red-50"
                >
                  <Trash2 size={14} className="mr-2" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Link to={`/snack/${snack.id}`} className="flex flex-col h-full" onClick={() => setShowMenu(false)}>
        <div className="relative h-[110px] bg-[var(--color-surface-raised)] flex items-center justify-center overflow-hidden rounded-t-[20px]">
          {snack.imageUrl ? (
            <img 
              src={snack.imageUrl} 
              alt={snack.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Package size={32} className="text-[var(--color-primary-light)]" strokeWidth={1.5} />
          )}
          
          {hasAllergens && (
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm z-10 border border-orange-100">
              <AlertTriangle size={14} className="text-orange-500" />
            </div>
          )}
        </div>

        <div className="p-2.5 flex flex-col flex-grow justify-between h-[70px]">
          <div>
            <h3 className="font-bold text-[var(--color-text-primary)] text-[13px] leading-tight line-clamp-2 mb-1">{snack.name}</h3>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-1.5 py-0.5 rounded-md truncate max-w-[60%]">
                {snack.category}
              </span>
              <QuantityBadge quantity={snack.quantity} />
            </div>
          </div>
        </div>
      </Link>

      <div className="px-2.5 pb-2.5 mt-auto">
        <button
          onClick={handleTakeOne}
          disabled={snack.quantity <= 0 || isTaking}
          className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            snack.quantity > 0 
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] shadow-sm' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isTaking ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Utensils size={12} />
              <span>Take One</span>
            </>
          )}
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-[var(--color-border)] w-full max-w-sm">
            <h3 className="text-xl font-display text-[var(--color-text-primary)] mb-2">Delete Snack?</h3>
            <p className="text-[var(--color-text-secondary)] mb-6 font-medium">
              Are you sure you want to delete <span className="font-bold text-[var(--color-text-primary)]">{snack.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-[var(--color-background)] text-[var(--color-text-secondary)] font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SnackCard;
