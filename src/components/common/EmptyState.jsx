import React from 'react';
import { motion } from 'motion/react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ icon, title = "Nothing here!", message = "Looks like this place is empty." }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <div className="mb-6 bg-[var(--color-primary-soft)] w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-sm text-[var(--color-primary)] rotate-3">
      {icon || <PackageOpen size={48} strokeWidth={1.5} />}
    </div>
    <h3 className="text-2xl font-display text-[var(--color-text-primary)] mb-2">{title}</h3>
    <p className="text-[var(--color-text-secondary)] font-medium max-w-xs">{message}</p>
  </motion.div>
);

export default EmptyState;
