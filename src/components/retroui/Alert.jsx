import React from 'react';
import { cn } from '../../utils/cn';

export const Alert = React.forwardRef(({ 
  className, 
  variant = 'default',
  children,
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-card border-border text-foreground',
    destructive: 'bg-destructive border-destructive text-destructive-foreground',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'p-4 border-2 shadow-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Alert.displayName = 'Alert';