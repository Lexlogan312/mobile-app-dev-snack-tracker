import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "Search snacks..." }) => (
  <div className="relative w-full mb-4">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Search size={18} className="text-[var(--color-primary-light)]" />
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[var(--color-border)] rounded-[20px] shadow-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-glow)] transition-all text-[var(--color-text-primary)] font-bold placeholder-[var(--color-text-secondary)]"
      placeholder={placeholder}
    />
  </div>
);

export default SearchBar;
