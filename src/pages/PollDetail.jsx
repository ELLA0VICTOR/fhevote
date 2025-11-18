import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { useContract } from '../hooks/useContract';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/retroui/Card';
import { Button } from '../components/retroui/Button';
import { Badge } from '../components/retroui/Badge';
import { VoteModal } from '../components/polls/VoteModal';
import { ResultsDisplay } from '../components/polls/ResultsDisplay';
import { LoadingSpinner } from '../components/retroui/common/LoadingSpinner';
import { toast } from 'sonner';
import { ArrowLeft, Clock, User } from 'lucide-react';

export const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, signer } = useWalletContext();
  const contractHook = useContract(signer);
  const { contract, getPoll, vote, hasVoted, closePoll, decryptAndSubmitResults } = contractHook;

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPollData = async () => {
    // Don't fetch if contract not ready
    if (!contract || !signer) {
      console.log('⏸️ Waiting for contract/signer to be ready...');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`📡 Fetching poll ${id}...`);
      
      const pollData = await getPoll(id);
      
      if (!pollData) {
        console.error('Poll data is null');
        toast.error('Poll not found');
        navigate('/');
        return;
      }
      
      const voted = account ? await hasVoted(id, account) : false;
      
      setPoll({
        id: Number(id),
        question: pollData.question,
        options: pollData.options,
        creator: pollData.creator,
        endTime: Number(pollData.endTime),
        isActive: pollData.isActive,
        finalResults: [] // Will be fetched separately if needed
      });
      
      setUserHasVoted(voted);
      console.log('✅ Poll data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to fetch poll:', error);
      toast.error('Failed to load poll');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, contract, signer, refreshKey]);

  const handleVote = async (optionIndex) => {
    if (!contract) {
      toast.error('Contract not ready, please refresh');
      return;
    }

    try {
      await vote(id, optionIndex, account);
      setUserHasVoted(true);
      toast.success('Vote cast successfully!');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Vote failed:', error);
      // Don't show toast here - VoteModal already handles it
    }
  };

  const handleClosePoll = async () => {
    if (!contract) {
      toast.error('Contract not ready, please refresh');
      return;
    }

    const toastId = toast.loading('Closing poll...');
    try {
      await closePoll(id);
      toast.success('Poll closed!', { id: toastId });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Close poll failed:', error);
      toast.error('Failed to close poll: ' + error.message, { id: toastId });
    }
  };

  const handleDecrypt = async () => {
    if (!contract) {
      toast.error('Contract not ready, please refresh');
      return;
    }

    try {
      await decryptAndSubmitResults(id, poll.options.length);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Decryption failed:', error);
      // Don't show toast here - ResultsDisplay already handles it
    }
  };

  // Show loading spinner while waiting for contract
  if (loading || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size={40} />
        <p className="text-muted-foreground">
          {!contract ? 'Initializing contract...' : 'Loading poll...'}
        </p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Poll not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPollEnded = Date.now() / 1000 >= poll.endTime;
  const isCreator = account && account.toLowerCase() === poll.creator.toLowerCase();

  const timeRemaining = () => {
    const now = Date.now() / 1000;
    const diff = poll.endTime - now;

    if (diff <= 0) return 'Poll ended';

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Back to Polls
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{poll.question}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User size={16} />
                {poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}
              </CardDescription>
            </div>
            <Badge variant={poll.isActive ? 'default' : 'secondary'}>
              {poll.isActive ? 'Active' : 'Closed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock size={16} />
            <span>{timeRemaining()}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Vote Section */}
        {poll.isActive && !isPollEnded && (
          <VoteModal
            poll={poll}
            onVote={handleVote}
            hasVoted={userHasVoted}
            account={account}
          />
        )}

        {/* Close Poll Button (Creator Only) */}
        {isCreator && isPollEnded && poll.isActive && (
          <Card className="bg-accent">
            <CardContent className="p-6">
              <p className="font-medium mb-4">Poll has ended - Close to decrypt results</p>
              <Button
                onClick={handleClosePoll}
                className="w-full"
              >
                Close Poll & Prepare Decryption
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        <ResultsDisplay
          poll={poll}
          isCreator={isCreator}
          onDecrypt={handleDecrypt}
        />
      </div>
    </div>
  );
};