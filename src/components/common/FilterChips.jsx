import React from 'react';

const FilterChips = ({ categories, selectedCategory, onSelect, tags = [], selectedTag, onSelectTag }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex overflow-x-auto pb-1.5 -mx-3 px-3 space-x-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full font-bold text-sm transition-all duration-200 ${
            selectedCategory === category
              ? 'bg-[var(--color-primary)] text-white shadow-md transform scale-105'
              : 'bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] border border-[var(--color-border)]'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
    
    {tags.length > 0 && (
      <div className="flex overflow-x-auto pb-1 -mx-3 px-3 space-x-2 scrollbar-hide">
        <button
          onClick={() => onSelectTag(null)}
          className={`whitespace-nowrap px-3 py-1 rounded-full font-bold text-xs transition-all duration-200 ${
            !selectedTag
              ? 'bg-[var(--color-secondary)] text-white shadow-sm'
              : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)]'
          }`}
        >
          All Tags
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onSelectTag(tag)}
            className={`whitespace-nowrap px-3 py-1 rounded-full font-bold text-xs transition-all duration-200 ${
              selectedTag === tag
                ? 'bg-[var(--color-secondary)] text-white shadow-sm transform scale-105'
                : 'bg-pink-50 text-[var(--color-secondary)] hover:bg-pink-100 border border-pink-100'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default FilterChips;
