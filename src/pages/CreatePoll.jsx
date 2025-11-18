import React from 'react';
import { CreatePollForm } from '../components/polls/CreatePollForm';

export const CreatePoll = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-head text-4xl mb-4">Create New Poll</h1>
        <p className="text-muted-foreground">
          Create a confidential poll with fully encrypted votes
        </p>
      </div>
      <CreatePollForm />
    </div>
  );
};