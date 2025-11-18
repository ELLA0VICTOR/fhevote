import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({ 
  className, 
  children,
  placeholder = 'Select option',
  value,
  onChange,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        className={cn(
          'w-full px-4 py-2 rounded border-2 shadow-md transition',
          'focus:outline-hidden focus:shadow-xs',
          'appearance-none cursor-pointer bg-background',
          'pr-10', // Space for chevron
          className
        )}
        {...props}
      >
        {placeholder && !value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown 
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" 
      />
    </div>
  );
});

Select.displayName = 'Select';