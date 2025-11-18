import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ className = '', size = 24 }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <Loader2 size={size} className="animate-spin" />
  </div>
);