import React from 'react';
import { CreatePollForm } from '../components/polls/CreatePollForm';

/**
 * ✅ MOBILE RESPONSIVE - Create Poll Page with mobile padding
 */
export const CreatePoll = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      <div className="mb-6 sm:mb-8 text-center px-2">
        <h1 className="font-head text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">
          Create New Poll
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Create a confidential poll with fully encrypted votes
        </p>
      </div>
      <CreatePollForm />
    </div>
  );
};