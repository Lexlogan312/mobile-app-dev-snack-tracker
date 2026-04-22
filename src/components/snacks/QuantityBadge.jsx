import React from 'react';
import { getQuantityLabel } from '../../lib/utils';

const QuantityBadge = ({ quantity, className = '' }) => {
  const { label, color, textColor } = getQuantityLabel(quantity);
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${className}`}
      style={{ backgroundColor: color, color: textColor }}
    >
      {label}
    </span>
  );
};

export default QuantityBadge;
