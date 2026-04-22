import React from 'react';
import { Cookie } from 'lucide-react';

const Loader = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
    <div className="animate-bounce text-[var(--color-primary)]">
      <Cookie size={48} strokeWidth={2} />
    </div>
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full animate-pulse"></div>
      <div className="w-3 h-3 bg-[var(--color-secondary)] rounded-full animate-pulse delay-75"></div>
      <div className="w-3 h-3 bg-[var(--color-primary-light)] rounded-full animate-pulse delay-150"></div>
    </div>
    <p className="text-[var(--color-text-secondary)] font-bold">{message}</p>
  </div>
);

export default Loader;
