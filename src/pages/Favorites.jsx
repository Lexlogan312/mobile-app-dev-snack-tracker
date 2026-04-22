import React, { useContext, useMemo } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import SnackGrid from '../components/snacks/SnackGrid';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { useSnacks } from '../hooks/useSnacks';
import { HeartCrack } from 'lucide-react';

import { FavoritesContext } from '../context/FavoritesContext';

const Favorites = () => {
  const { snacks, loading } = useSnacks();
  const { favorites } = useContext(FavoritesContext);

  const favoriteSnacks = useMemo(() => {
    return snacks.filter(snack => favorites.includes(snack.id));
  }, [snacks, favorites]);

  if (loading) return <PageWrapper><Loader /></PageWrapper>;

  return (
    <PageWrapper className="pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-display text-[var(--color-text-primary)] tracking-tight">Favorites</h1>
        <p className="text-[var(--color-text-secondary)] mt-1 font-medium">Your most loved snacks</p>
      </div>

      {favoriteSnacks.length > 0 ? (
        <SnackGrid snacks={favoriteSnacks} />
      ) : (
        <EmptyState 
          icon={<HeartCrack size={48} className="text-[var(--color-primary-light)]" strokeWidth={1.5} />} 
          title="No favorites yet!" 
          message="Tap the heart on a snack to save it here." 
        />
      )}
    </PageWrapper>
  );
};

export default Favorites;
