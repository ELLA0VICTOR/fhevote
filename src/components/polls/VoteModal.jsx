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

  const isPollEnded = Date.now() / 1000 >= poll.endTime;

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

  if (isPollEnded) {
    return (
      <Card className="bg-muted">
        <CardContent className="p-6 text-center">
          <p className="font-medium">This poll has ended</p>
          <p className="text-sm text-muted-foreground mt-2">
            Waiting for creator to reveal results
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
      </CardFooter>
    </Card>
  );
};