import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Lightbulb, ThumbsUp, Plus, CheckCircle, XCircle, ScanBarcode, ShoppingCart, PackagePlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageWrapper from '../components/layout/PageWrapper';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { useScanner } from '../hooks/useScanner';
import { useSuggestions } from '../hooks/useSuggestions';
import { useAdmin } from '../hooks/useAdmin';
import { useShoppingList } from '../hooks/useShoppingList';
import { scanBarcode, fetchSnackByBarcode } from '../lib/barcodeScanner';

const CATEGORIES = ["Chips", "Candy", "Drinks", "Healthy", "Bakery", "Misc"];

const Suggestions = () => {
  const { suggestions, loading } = useSuggestions();
  const { isAdmin } = useAdmin();
  const { startScan } = useScanner();
  const { addItem: addToShoppingList } = useShoppingList();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const barcodeParam = searchParams.get('barcode');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(!!barcodeParam || searchParams.get('new') === 'true');
  const [adminFilter, setAdminFilter] = useState('pending'); // 'all', 'pending', 'approved', 'declined'
  const [formData, setFormData] = useState({
    snackName: '',
    reason: '',
    category: 'Misc',
    barcode: barcodeParam || ''
  });

  const [upvotedIds, setUpvotedIds] = useState(() => {
    const saved = localStorage.getItem('upvotedSuggestions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('upvotedSuggestions', JSON.stringify(upvotedIds));
  }, [upvotedIds]);

  useEffect(() => {
    if (barcodeParam) {
      handleBarcodeLookup(barcodeParam);
    }
  }, [barcodeParam]);

  const handleBarcodeLookup = async (barcode) => {
    const toastId = toast.loading('Looking up snack details...');
    const details = await fetchSnackByBarcode(barcode);
    if (details) {
      setFormData(prev => ({
        ...prev,
        snackName: details.name || prev.snackName,
        reason: details.description ? `It's a ${details.description}` : prev.reason
      }));
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

  const handleAddToShoppingList = async (suggestion) => {
    try {
      await addToShoppingList({
        name: suggestion.snackName,
        isManual: true,
        priority: 'normal',
        notes: `Suggested by user. Category: ${suggestion.category}`
      });
      
      // Optionally mark as approved if it was pending
      if (suggestion.status === 'pending') {
        await handleStatusChange(suggestion.id, 'approved');
      }
      
      toast.success('Added to shopping list!');
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      toast.error('Failed to add to shopping list');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.snackName.trim()) return;

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'suggestions'), {
        ...formData,
        status: 'pending',
        upvotes: 0, // Starts at 0 as per database reference
        submittedAt: serverTimestamp()
      });
      
      // Auto-upvote for the creator
      await updateDoc(docRef, {
        upvotes: increment(1)
      });
      setUpvotedIds(prev => [...prev, docRef.id]);
      
      toast.success('Suggestion submitted! 🦆', { icon: '🦆' });
      setFormData({ snackName: '', reason: '', category: 'Misc', barcode: '' });
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting suggestion:", error, error.code, error.message);
      toast.error(`Failed to submit suggestion: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    if (upvotedIds.includes(id)) {
      toast('You already upvoted this!', { icon: '👍' });
      return;
    }

    try {
      const ref = doc(db, 'suggestions', id);
      await updateDoc(ref, {
        upvotes: increment(1)
      });
      setUpvotedIds([...upvotedIds, id]);
      toast.success('Upvoted!');
    } catch (error) {
      console.error("Error upvoting:", error);
      toast.error('Failed to upvote');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    if (!isAdmin) return;
    try {
      const ref = doc(db, 'suggestions', id);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Suggestion marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Failed to update status');
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (!isAdmin) return true;
    if (adminFilter === 'all') return true;
    return s.status === adminFilter;
  });

  if (loading) return <PageWrapper><Loader /></PageWrapper>;

  return (
    <PageWrapper className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-display text-[var(--color-text-primary)] tracking-tight">Suggestions</h1>
          <p className="text-[var(--color-text-secondary)] mt-1 font-medium">What should we stock next?</p>
        </div>
        {!showForm && !isAdmin && (
          <button 
            onClick={() => setShowForm(true)}
            className="p-3 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-glow)] transition-colors shadow-sm"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'pending', 'approved', 'declined'].map(filter => (
            <button
              key={filter}
              onClick={() => setAdminFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all border-2 ${
                adminFilter === filter 
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' 
                  : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary-light)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[32px] p-6 shadow-xl border border-[var(--color-border)] w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display text-[var(--color-text-primary)]">Suggest a Snack 💡</h2>
              <button onClick={() => setShowForm(false)} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Snack Name *</label>
                <input
                  type="text"
                  value={formData.snackName}
                  onChange={e => setFormData({...formData, snackName: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-bold text-[var(--color-text-primary)]"
                  placeholder="e.g., Spicy Nacho Doritos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Why do we need this?</label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-medium text-[var(--color-text-primary)] resize-none"
                  placeholder="It's the best flavor..."
                  rows="3"
                  maxLength={140}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-bold text-[var(--color-text-primary)]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Barcode (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={e => setFormData({...formData, barcode: e.target.value})}
                      className="flex-1 px-4 py-3 bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-bold text-[var(--color-text-primary)]"
                      placeholder="Scan or type..."
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
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !formData.snackName.trim()}
                className="w-full mt-4 bg-[var(--color-primary)] text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:bg-[var(--color-primary-light)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <div className="space-y-4">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map(suggestion => (
            <motion.div 
              key={suggestion.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white rounded-3xl p-5 shadow-sm border-2 ${
                suggestion.status === 'approved' ? 'border-green-200 bg-green-50/30' :
                suggestion.status === 'declined' ? 'border-red-200 bg-red-50/30 opacity-75' :
                'border-[var(--color-border)]'
              }`}
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button 
                    onClick={() => handleUpvote(suggestion.id)}
                    disabled={upvotedIds.includes(suggestion.id) || suggestion.status !== 'pending'}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      upvotedIds.includes(suggestion.id) 
                        ? 'bg-[var(--color-primary)] text-white shadow-md' 
                        : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary-glow)]'
                    } ${suggestion.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ThumbsUp size={20} className={upvotedIds.includes(suggestion.id) ? 'fill-current' : ''} />
                    <span className="font-black mt-1">{suggestion.upvotes || 0}</span>
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xl font-display text-[var(--color-text-primary)] truncate">{suggestion.snackName}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider shrink-0 ml-2 ${
                      suggestion.status === 'approved' ? 'bg-green-100 text-green-700' :
                      suggestion.status === 'declined' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {suggestion.status}
                    </span>
                  </div>
                  <span className="inline-block text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 border border-[var(--color-primary-glow)]">
                    {suggestion.category}
                  </span>
                  {suggestion.reason && (
                    <p className="text-[var(--color-text-secondary)] text-sm font-medium line-clamp-2">{suggestion.reason}</p>
                  )}
                  
                  {isAdmin && suggestion.status === 'pending' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                      <button 
                        onClick={() => handleStatusChange(suggestion.id, 'approved')}
                        className="flex-1 py-2 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleStatusChange(suggestion.id, 'declined')}
                        className="flex-1 py-2 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle size={16} /> Decline
                      </button>
                    </div>
                  )}
                  {isAdmin && suggestion.status === 'approved' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                      <button 
                        onClick={() => navigate(`/admin/snack/new?name=${encodeURIComponent(suggestion.snackName)}&category=${encodeURIComponent(suggestion.category)}&barcode=${encodeURIComponent(suggestion.barcode || '')}`)}
                        className="flex-1 py-2 bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold rounded-xl hover:bg-[var(--color-primary-glow)] transition-colors flex items-center justify-center gap-1"
                      >
                        <PackagePlus size={16} /> Add to Inventory
                      </button>
                      <button 
                        onClick={() => handleAddToShoppingList(suggestion)}
                        className="flex-1 py-2 bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold rounded-xl hover:bg-[var(--color-primary-glow)] transition-colors flex items-center justify-center gap-1"
                      >
                        <ShoppingCart size={16} /> Add to List
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyState 
            icon={<Lightbulb size={48} className="text-[var(--color-primary-light)]" strokeWidth={1.5} />} 
            title="No suggestions yet!" 
            message="Be the first to suggest a new snack." 
          />
        )}
      </div>
    </PageWrapper>
  );
};

export default Suggestions;
