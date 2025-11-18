import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ 
  className = '', 
  variant = 'default', 
  size = 'md',
  children,
  disabled,
  asChild = false,
  ...props 
}, ref) => {
  // Variant styles matching RetroUI
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'shadow-md hover:shadow active:shadow-none bg-secondary text-secondary-foreground border-2 border-black transition hover:translate-y-1 active:translate-y-2 active:translate-x-1';
      case 'outline':
        return 'shadow-md hover:shadow active:shadow-none bg-transparent border-2 transition hover:translate-y-1 active:translate-y-2 active:translate-x-1';
      case 'link':
        return 'bg-transparent hover:underline';
      default: // default
        return 'shadow-md hover:shadow active:shadow-none bg-primary text-primary-foreground border-2 border-black transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-primary-hover';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm shadow hover:shadow-none';
      case 'lg':
        return 'px-6 lg:px-8 py-2 lg:py-3 text-md lg:text-lg';
      case 'icon':
        return 'p-2';
      default: // md
        return 'px-4 py-1.5 text-base';
    }
  };

  const Comp = asChild ? 'span' : 'button';

  return (
    <Comp
      ref={ref}
      className={cn(
        'font-head transition-all outline-hidden cursor-pointer duration-200 font-medium flex items-center justify-center',
        getVariantStyles(),
        getSizeStyles(),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </Comp>
  );
});

Button.displayName = 'Button';