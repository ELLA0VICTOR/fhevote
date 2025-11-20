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
import { ArrowLeft, Clock, User, Trash2, RefreshCw } from 'lucide-react';

/**
 * ✅ FIXED: Poll Detail Component with accurate timer and clean logging
 */
export const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, signer } = useWalletContext();
  const contractHook = useContract(signer);
  const { contract, getPoll, vote, hasVoted, closePoll, deletePoll, decryptAndSubmitResults } = contractHook;

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [voteEvents, setVoteEvents] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchPollData = async () => {
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
      
      const pollState = {
        id: Number(id),
        question: pollData.question,
        options: pollData.options,
        creator: pollData.creator,
        endTime: Number(pollData.endTime),
        isActive: pollData.isActive,
        finalResults: pollData.finalResults || []
      };
      
      setPoll(pollState);
      setUserHasVoted(voted);
      
      // Fetch vote events for live tracking
      try {
        const filter = contract.filters.VoteCast(id);
        const events = await contract.queryFilter(filter);
        setVoteEvents(events);
        console.log(`📊 Fetched ${events.length} vote event(s)`);
      } catch (error) {
        console.error('Failed to fetch vote events:', error);
      }
      
      console.log('✅ Poll data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to fetch poll:', error);
      toast.error('Failed to load poll');
      navigate('/');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (contract && signer) {
      fetchPollData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, contract, signer, refreshKey]);

  useEffect(() => {
    if (!contract || !poll || !poll.isActive) return;

    const now = Date.now() / 1000;
    const isPollExpired = now >= poll.endTime;
    
    if (isPollExpired) {
      console.log('⏹️ Poll expired, not setting up event listener');
      return;
    }

    console.log('👂 Setting up real-time event listener for VoteCast...');
    
    const filter = contract.filters.VoteCast(id);
    
    const handleVoteEvent = async (pollId, voter, event) => {
      console.log('🔔 New vote detected!', { pollId: pollId.toString(), voter });
      
      try {
        const events = await contract.queryFilter(filter);
        setVoteEvents(events);
        console.log(`📊 Updated to ${events.length} vote event(s)`);
      } catch (error) {
        console.error('Failed to fetch updated vote events:', error);
      }
    };
    
    contract.on(filter, handleVoteEvent);

    return () => {
      console.log('🛑 Removing event listener');
      contract.off(filter, handleVoteEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract, poll?.id, poll?.isActive, poll?.endTime]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
  };

  const handleVote = async (optionIndex) => {
    if (!contract) {
      toast.error('Contract not ready, please refresh');
      return;
    }

    if (currentTime >= poll.endTime) {
      toast.error('This poll has ended. No more votes accepted.');
      return;
    }

    if (!poll.isActive) {
      toast.error('This poll is closed. No more votes accepted.');
      return;
    }

    try {
      await vote(id, optionIndex, account);
      setUserHasVoted(true);
      toast.success('Vote cast successfully!');
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Vote failed:', error);
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
      toast.success('Poll closed! You can now decrypt results.', { id: toastId });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Close poll failed:', error);
      toast.error('Failed to close poll: ' + error.message, { id: toastId });
    }
  };

  const handleDeletePoll = async () => {
    if (!contract) {
      toast.error('Contract not ready, please refresh');
      return;
    }

    const toastId = toast.loading('Deleting poll...');
    try {
      await deletePoll(id);
      toast.success('Poll deleted successfully!', { id: toastId });
      navigate('/');
    } catch (error) {
      console.error('Delete poll failed:', error);
      toast.error('Failed to delete poll: ' + error.message, { id: toastId });
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
    }
  };

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

  const isPollExpired = currentTime >= poll.endTime;
  const isCreator = account && account.toLowerCase() === poll.creator.toLowerCase();

  /**
   * ✅ FIXED: Clean timer calculation with NO console spam
   */
  const timeRemaining = () => {
    const diff = poll.endTime - currentTime;

    if (diff <= 0) return 'Poll ended';

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
    return `${seconds}s remaining`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Polls
        </Button>

        {poll.isActive && !isPollExpired && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

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
            <div className="flex gap-2 items-center">
              <Badge variant={poll.isActive && !isPollExpired ? 'default' : 'secondary'}>
                {poll.isActive && !isPollExpired ? 'Active' : 'Ended'}
              </Badge>
              
              {isCreator && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock size={16} />
            <span>{timeRemaining()}</span>
          </div>
        </CardContent>
      </Card>

      {showDeleteConfirm && (
        <Card className="mb-8 border-destructive">
          <CardContent className="p-6">
            <h3 className="font-head text-xl mb-2">Delete Poll?</h3>
            <p className="text-muted-foreground mb-4">
              This action cannot be undone. All votes will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDeletePoll}>
                Yes, Delete Poll
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ FIXED: Wider container with better card spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {poll.isActive && !isPollExpired && (
          <VoteModal
            poll={poll}
            onVote={handleVote}
            hasVoted={userHasVoted}
            account={account}
          />
        )}

        {isCreator && isPollExpired && poll.isActive && (
          <Card className="bg-accent lg:col-span-2">
            <CardContent className="p-6">
              <p className="font-medium mb-4">Poll has ended - Close to prepare for decryption</p>
              <Button onClick={handleClosePoll} className="w-full">
                Close Poll & Mark for Decryption
              </Button>
            </CardContent>
          </Card>
        )}

        <ResultsDisplay
          poll={poll}
          isCreator={isCreator}
          onDecrypt={handleDecrypt}
          voteEvents={voteEvents}
        />
      </div>
    </div>
  );
};