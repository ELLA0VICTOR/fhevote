import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../retroui/Card';
import { RadioGroup } from '../retroui/Radio';
import { Button } from '../retroui/Button';
import { toast } from '../retroui/Sonner';

export const VoteModal = ({ poll, onVote, hasVoted, account }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (selectedOption === null) {
      toast.error('Please select an option');
      return;
    }

    // CRITICAL: Double-check poll hasn't expired before submitting
    const now = Date.now() / 1000;
    if (now >= poll.endTime) {
      toast.error('This poll has ended while you were voting');
      return;
    }

    if (!poll.isActive) {
      toast.error('This poll is closed');
      return;
    }

    setIsVoting(true);
    const toastId = toast.loading('Encrypting your vote...');

    try {
      await onVote(selectedOption);
      toast.success('Vote cast successfully!', { id: toastId });
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error('Failed to cast vote: ' + error.message, { id: toastId });
    } finally {
      setIsVoting(false);
    }
  };

  // Check both isActive flag AND time-based expiry
  const now = Date.now() / 1000;
  const isPollExpired = now >= poll.endTime;

  if (hasVoted) {
    return (
      <Card className="bg-accent">
        <CardContent className="p-6 text-center">
          <p className="font-medium">✓ You've already voted in this poll</p>
          <p className="text-sm text-muted-foreground mt-2">
            Results will be revealed when the poll closes
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isPollExpired || !poll.isActive) {
    return (
      <Card className="bg-muted">
        <CardContent className="p-6 text-center">
          <p className="font-medium">This poll has ended</p>
          <p className="text-sm text-muted-foreground mt-2">
            {poll.isActive 
              ? 'Waiting for creator to close and reveal results'
              : 'Waiting for results decryption'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedOption?.toString()}>
          {poll.options.map((option, index) => (
            <RadioGroup.Item
              key={index}
              id={`option-${index}`}
              name="vote"
              value={index.toString()}
              label={option}
              checked={selectedOption === index}
              onChange={() => setSelectedOption(index)}
              disabled={isVoting}
            />
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleVote}
          disabled={selectedOption === null || isVoting || !account}
          className="w-full"
        >
          {isVoting ? 'Casting Vote...' : 'Cast Vote'}
        </Button>
        {!account && (
          <p className="text-sm text-muted-foreground text-center w-full mt-2">
            Please connect your wallet to vote
          </p>
        )}
      </CardFooter>
    </Card>
  );
};