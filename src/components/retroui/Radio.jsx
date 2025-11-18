import React from 'react';
import { cn } from '../../utils/cn';

const RadioGroupRoot = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('grid gap-2', className)} {...props} />
));
RadioGroupRoot.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef(({ 
  className,
  id,
  label,
  variant = 'default',
  size = 'md',
  ...props 
}, ref) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  const getIndicatorSize = () => {
    switch (size) {
      case 'sm': return 'h-2 w-2';
      case 'lg': return 'h-3.5 w-3.5';
      default: return 'h-2.5 w-2.5';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'solid': return 'checked:bg-foreground';
      case 'outline': return '';
      default: return 'checked:bg-primary';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          ref={ref}
          id={id}
          className={cn(
            'appearance-none border-2 border-border rounded-full cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            getSizeClass(),
            getVariantClass(),
            className
          )}
          {...props}
        />
        <span 
          className={cn(
            'absolute pointer-events-none rounded-full',
            'transition-opacity',
            getIndicatorSize(),
            variant === 'solid' ? 'bg-border' : variant === 'outline' ? 'border-2 border-border' : 'bg-primary border-2 border-border'
          )}
          style={{
            opacity: props.checked ? 1 : 0
          }}
        />
      </div>
      {label && (
        <label htmlFor={id} className="cursor-pointer font-medium">
          {label}
        </label>
      )}
    </div>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

// Export as object with sub-components
const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
});

export { RadioGroup };