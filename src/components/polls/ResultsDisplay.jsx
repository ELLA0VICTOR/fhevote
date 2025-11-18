import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../retroui/Card';
import { Button } from '../retroui/Button';
import { BarChart } from '../retroui/charts/BarChart';
import { LoadingSpinner } from '../retroui/common/LoadingSpinner';
import { toast } from 'sonner';
import { Lock, Unlock } from 'lucide-react';

export const ResultsDisplay = ({ poll, isCreator, onDecrypt }) => {
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleDecrypt = async () => {
    setIsDecrypting(true);
    const toastId = toast.loading('Decrypting results...');

    try {
      await onDecrypt();
      toast.success('Results revealed!', { id: toastId });
    } catch (error) {
      console.error('Decryption failed:', error);
      toast.error('Failed to decrypt results: ' + error.message, { id: toastId });
    } finally {
      setIsDecrypting(false);
    }
  };

  const isPollEnded = Date.now() / 1000 >= poll.endTime;
  const hasResults = poll.finalResults && poll.finalResults.length > 0;

  // Show results if available
  if (hasResults) {
    const chartData = poll.options.map((option, index) => ({
      name: option,
      votes: poll.finalResults[index] || 0
    }));

    const totalVotes = poll.finalResults.reduce((sum, v) => sum + v, 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock size={24} />
            Final Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Total votes: {totalVotes}
          </p>
          <BarChart
            data={chartData}
            index="name"
            categories={["votes"]}
            fillColors={["var(--primary)"]}
          />
        </CardContent>
      </Card>
    );
  }

  // Show encrypted state
  if (!poll.isActive) {
    if (isCreator) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={24} />
              Encrypted Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Poll has ended. Click below to decrypt and reveal the final results.
            </p>
            <Button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="w-full"
            >
              {isDecrypting ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Decrypting...
                </>
              ) : (
                'Decrypt & Reveal Results'
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-muted">
        <CardContent className="p-6 text-center">
          <Lock size={32} className="mx-auto mb-3" />
          <p className="font-medium">Results are encrypted</p>
          <p className="text-sm text-muted-foreground mt-2">
            Waiting for poll creator to decrypt results
          </p>
        </CardContent>
      </Card>
    );
  }

  // Poll still active
  if (isPollEnded && poll.isActive) {
    return (
      <Card className="bg-accent">
        <CardContent className="p-6 text-center">
          <p className="font-medium">Poll has ended</p>
          <p className="text-sm text-muted-foreground mt-2">
            Waiting for creator to close poll
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Voting</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Poll is still active. Results will be shown after closing.
        </p>
      </CardContent>
    </Card>
  );
};