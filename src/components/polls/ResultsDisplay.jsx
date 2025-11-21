import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../retroui/Card';
import { Button } from '../retroui/Button';
import { Badge } from '../retroui/Badge';
import { Progress } from '../retroui/Progress';
import { BarChart } from '../retroui/charts/BarChart';
import { LoadingSpinner } from '../retroui/common/LoadingSpinner';
import { toast } from 'sonner';
import { Lock, Unlock, TrendingUp } from 'lucide-react';

/**
 * ✅ MOBILE RESPONSIVE - Results Display optimized for mobile screens
 */
export const ResultsDisplay = ({ poll, isCreator, onDecrypt, voteEvents = [], isDecrypting }) => {
  const [liveVoteCount, setLiveVoteCount] = useState(0);

  useEffect(() => {
    if (voteEvents && Array.isArray(voteEvents)) {
      setLiveVoteCount(voteEvents.length);
    }
  }, [voteEvents]);

  const handleDecrypt = async () => {
    const toastId = toast.loading('Decrypting results...');

    try {
      await onDecrypt();
      toast.success('Results revealed!', { id: toastId });
    } catch (error) {
      console.error('Decryption failed at ResultsDisplay:', error);
      toast.error('Decryption failed. Check console for details.', { id: toastId });
    }
  };

  const isPollEnded = Date.now() / 1000 >= poll.endTime;
  const hasResults = poll.finalResults && poll.finalResults.length > 0;

  // CASE 1: Final Decrypted Results - Mobile Optimized
  if (hasResults) {
    const chartData = poll.options.map((option, index) => ({
      name: option,
      votes: poll.finalResults[index] || 0
    }));

    const totalVotes = poll.finalResults.reduce((sum, v) => sum + v, 0);
    const winningVotes = Math.max(...poll.finalResults);
    const winnerIndices = poll.finalResults
      .map((v, i) => (v === winningVotes ? i : -1))
      .filter(i => i !== -1);

    return (
      <Card className="lg:col-span-2">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
              <Unlock size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              Final Results
            </CardTitle>
            <Badge variant="default" className="text-xs sm:text-sm">Decrypted</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm sm:text-base">
              Total votes: <strong className="text-foreground">{totalVotes}</strong>
            </p>
            {winnerIndices.length === 1 && totalVotes > 0 && (
              <Badge variant="default" className="text-xs sm:text-sm">
                Winner: {poll.options[winnerIndices[0]]}
              </Badge>
            )}
          </div>
          
          {/* Chart - Scrollable on small screens */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[300px]">
              <BarChart
                data={chartData}
                index="name"
                categories={["votes"]}
                fillColors={["var(--primary)"]}
              />
            </div>
          </div>

          {/* Individual results with progress bars */}
          <div className="space-y-3">
            {poll.options.map((option, index) => {
              const voteCount = poll.finalResults[index];
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              const isWinner = winnerIndices.includes(index);
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm sm:text-base truncate flex-1">{option}</span>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold">{voteCount}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    max={100} 
                    className={`h-2.5 sm:h-3 ${isWinner ? 'border-primary' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // CASE 2: Poll Ended - Waiting for Decryption
  if (!poll.isActive) {
    if (isCreator) {
      return (
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Lock size={20} className="sm:w-6 sm:h-6 flex-shrink-0" />
              Encrypted Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="bg-accent p-3 sm:p-4 rounded-lg border-2 border-border">
              <p className="font-medium mb-2 text-sm sm:text-base">Results are encrypted</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {liveVoteCount} {liveVoteCount === 1 ? 'vote' : 'votes'} cast during this poll
              </p>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Poll has ended. Click below to decrypt and reveal the final results.
            </p>
            <Button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="w-full text-sm sm:text-base"
            >
              {isDecrypting ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  <span className="hidden sm:inline">Decryption Proof Generating...</span>
                  <span className="sm:hidden">Generating Proof...</span>
                </>
              ) : (
                <>
                  <Unlock size={16} className="mr-2" />
                  Decrypt & Reveal Results
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-muted lg:col-span-2">
        <CardContent className="p-4 sm:p-6 text-center space-y-3">
          <Lock size={28} className="sm:w-8 sm:h-8 mx-auto" />
          <p className="font-medium text-sm sm:text-base">Results are encrypted</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {liveVoteCount} {liveVoteCount === 1 ? 'vote' : 'votes'} cast
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Waiting for poll creator to decrypt results
          </p>
        </CardContent>
      </Card>
    );
  }

  // CASE 3: Poll Ended but Not Closed Yet
  if (isPollEnded && poll.isActive) {
    return (
      <Card className="bg-accent lg:col-span-2">
        <CardContent className="p-4 sm:p-6 text-center space-y-3">
          <p className="font-medium text-sm sm:text-base">Poll has ended</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {liveVoteCount} {liveVoteCount === 1 ? 'vote' : 'votes'} cast
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Waiting for creator to close poll
          </p>
        </CardContent>
      </Card>
    );
  }

  // CASE 4: LIVE VOTING - Mobile Optimized
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Live Voting</CardTitle>
          <Badge variant="default" className="text-xs sm:text-sm">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Vote Count Display - Mobile Friendly */}
        <div className="bg-accent p-3 sm:p-4 rounded-lg border-2 border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp size={18} className="sm:w-5 sm:h-5 text-primary" />
            <p className="text-2xl sm:text-3xl font-bold">{liveVoteCount}</p>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {liveVoteCount === 1 ? 'vote' : 'votes'} cast so far
          </p>
        </div>

        {/* Vote Progress Bars */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Lock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              Vote Participation
            </p>
            <span className="text-xs text-muted-foreground">
              {liveVoteCount} total
            </span>
          </div>
          
          <div className="space-y-3">
            {poll.options.map((option, index) => {
              const estimatedProgress = liveVoteCount > 0 
                ? Math.min((liveVoteCount / poll.options.length) * 20, 100)
                : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                    <span className="font-medium truncate flex-1">{option}</span>
                    <span className="text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Lock size={10} className="sm:w-3 sm:h-3" />
                      <span className="hidden xs:inline">Encrypted</span>
                    </span>
                  </div>
                  <Progress 
                    value={estimatedProgress} 
                    max={100} 
                    className="h-2.5 sm:h-3"
                  />
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Progress bars show voting activity. Actual distribution will be revealed when poll closes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};