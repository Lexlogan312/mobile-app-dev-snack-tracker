import React from 'react';
import { motion } from 'motion/react';

const PageWrapper = ({ children, className = '', noPadding = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`min-h-screen pb-20 max-w-3xl mx-auto ${noPadding ? '' : 'pt-4 px-4'} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
