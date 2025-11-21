import React from 'react';
import { PollCard } from './PollCard';
import { LoadingSpinner } from '../retroui/common/LoadingSpinner';

/**
 * ✅ MOBILE RESPONSIVE - Poll List with responsive grid
 */
export const PollList = ({ polls, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8 sm:py-12">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-muted-foreground text-base sm:text-lg">No active polls found</p>
        <p className="text-muted-foreground text-xs sm:text-sm mt-2">Create the first one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
};