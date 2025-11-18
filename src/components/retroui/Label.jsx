import React from 'react';
import { cn } from '../../utils/cn';

export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('block text-sm font-medium mb-2', className)}
    {...props}
  />
));

Label.displayName = 'Label';