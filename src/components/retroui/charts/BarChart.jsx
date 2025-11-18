import React from 'react';
import { cn } from '../../../utils/cn';

export const BarChart = ({ 
  data = [], 
  index, 
  categories = [], 
  fillColors = ['var(--primary)'],
  className 
}) => {
  const maxValue = Math.max(...data.map(d => d[categories[0]] || 0));

  return (
    <div className={cn('space-y-4', className)}>
      {data.map((item, i) => {
        const value = item[categories[0]] || 0;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

        return (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">{item[index]}</span>
              <span className="text-muted-foreground">{value} votes</span>
            </div>
            <div className="h-8 bg-muted border-2 border-border relative overflow-hidden">
              <div 
                className="h-full border-r-2 border-border transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: fillColors[0]
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};