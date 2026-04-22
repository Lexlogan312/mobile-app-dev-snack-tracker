import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Settings, SearchX, ScanBarcode, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import PageWrapper from '../components/layout/PageWrapper';
import SearchBar from '../components/common/SearchBar';
import FilterChips from '../components/common/FilterChips';
import SnackGrid from '../components/snacks/SnackGrid';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { useSnacks } from '../hooks/useSnacks';
import { useAdmin } from '../hooks/useAdmin';
import { useScanner } from '../hooks/useScanner';
import toast from 'react-hot-toast';

const CATEGORIES = ["All", "Chips", "Candy", "Drinks", "Healthy", "Bakery", "Misc"];

const Home = () => {
  const { snacks, loading } = useSnacks();
  const { isAdmin } = useAdmin();
  const { startScan } = useScanner();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState(null);
  const [sortBy, setSortBy] = useState('name-asc');

  const allTags = useMemo(() => {
    const tags = new Set();
    snacks.forEach(snack => {
      if (snack.tags) {
        snack.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [snacks]);

  const filteredAndSortedSnacks = useMemo(() => {
    let result = [...snacks];

    if (searchQuery) {
      result = result.filter(snack => 
        snack.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(snack => snack.category === selectedCategory);
    }

    if (selectedTag) {
      result = result.filter(snack => snack.tags && snack.tags.includes(selectedTag));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'qty-asc':
          return a.quantity - b.quantity;
        case 'popular':
          return (b.timesConsumed || 0) - (a.timesConsumed || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [snacks, searchQuery, selectedCategory, selectedTag, sortBy]);

  const handleScan = () => {
    startScan((barcode) => {
      const foundSnack = snacks.find(s => s.barcode === barcode);
      if (foundSnack) {
        if (isAdmin) {
          navigate(`/admin/snack/${foundSnack.id}/edit`);
        } else {
          navigate(`/snack/${foundSnack.id}`);
        }
      } else {
        if (isAdmin) {
          navigate(`/admin/snack/new?barcode=${barcode}`);
        } else {
          toast('We don\'t have that one yet — want to suggest it? 💡', {
            icon: '🦆',
            duration: 4000,
          });
          navigate(`/suggestions?barcode=${barcode}`);
        }
      }
    });
  };

  if (loading) return <PageWrapper noPadding><Loader /></PageWrapper>;

  return (
    <PageWrapper noPadding>
      <div className="bg-gradient-to-br from-[var(--color-primary)] via-[#A855F7] to-[var(--color-secondary)] pt-safe-top pb-14 px-4 relative overflow-hidden rounded-b-[40px] shadow-sm">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>
        <div className="relative z-10 flex justify-between items-center mt-8 mb-4 max-w-3xl mx-auto">
          <h1 className="text-4xl font-display text-white tracking-wide drop-shadow-md">Super Snack Snatcher</h1>
          <div className="flex items-center gap-3">
            <button onClick={handleScan} className="text-white/90 hover:text-white transition-colors bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <ScanBarcode size={24} />
            </button>
            {!isAdmin && (
              <Link to="/admin/login" className="text-white/70 hover:text-white transition-colors">
                <span className="sr-only">Admin Login</span>
                <Settings size={24} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 max-w-3xl mx-auto -mt-16 relative z-20">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        
        <div className="bg-white rounded-3xl p-3 shadow-[0_4px_20px_rgba(124,58,237,0.05)] border border-[var(--color-border)] mb-3">
          <FilterChips 
            categories={CATEGORIES} 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory}
            tags={allTags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
          />
        </div>

        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-display text-[var(--color-text-primary)]">Inventory</h2>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border-2 border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] rounded-xl px-3 py-1.5 shadow-sm focus:ring-2 focus:ring-[var(--color-primary-glow)] outline-none"
          >
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="qty-asc">Low Stock</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        {filteredAndSortedSnacks.length > 0 ? (
          <SnackGrid snacks={filteredAndSortedSnacks} />
        ) : (
          <EmptyState 
            icon={<SearchX size={48} className="text-[var(--color-primary-light)]" strokeWidth={1.5} />} 
            title="No snacks found!" 
            message="Try adjusting your search or filters." 
          />
        )}

        {!isAdmin && (
          <div className="mt-8 mb-4">
            <Link to="/suggestions?new=true" className="flex items-center justify-center gap-2 w-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold py-4 rounded-2xl border-2 border-[var(--color-primary-glow)] hover:bg-[var(--color-primary-glow)] transition-colors">
              <Lightbulb size={20} />
              Suggest a Snack 💡
            </Link>
          </div>
        )}
      </div>

      {isAdmin && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-20 right-6 z-50"
        >
          <Link 
            to="/admin/snack/new"
            className="flex items-center justify-center w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-[0_6px_24px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.5)] transition-shadow"
          >
            <Plus size={28} strokeWidth={2.5} />
          </Link>
        </motion.div>
      )}
    </PageWrapper>
  );
};

export default Home;
