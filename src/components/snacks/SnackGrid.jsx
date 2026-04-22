import React from 'react';
import { motion } from 'motion/react';
import SnackCard from './SnackCard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const SnackGrid = ({ snacks }) => {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 justify-items-center"
    >
      {snacks.map((snack) => (
        <motion.div key={snack.id} variants={item} className="w-full max-w-[170px] sm:max-w-[220px]">
          <SnackCard snack={snack} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SnackGrid;
