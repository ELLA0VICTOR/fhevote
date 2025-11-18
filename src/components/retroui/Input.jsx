import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ 
  type = 'text',
  placeholder = 'Enter text',
  className = '',
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      placeholder={placeholder}
      className={cn(
        'px-4 py-2 w-full rounded border-2 shadow-md transition focus:outline-hidden focus:shadow-xs',
        props['aria-invalid'] && 'border-destructive text-destructive shadow-xs shadow-destructive',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';