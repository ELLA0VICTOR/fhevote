import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = React.forwardRef(({ 
  className, 
  variant = 'default',
  children,
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-primary text-primary-foreground border-border',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    outline: 'bg-transparent text-foreground border-border',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center px-3 py-1 text-sm font-medium',
        'border-2 shadow-xs',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';