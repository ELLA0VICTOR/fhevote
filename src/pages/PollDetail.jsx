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
 * ✅ MOBILE RESPONSIVE - Poll Detail Page optimized for all screen sizes
 */
export const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, signer } = useWalletContext();
  const contractHook = useContract(signer);
  const { contract, getPoll, vote, hasVoted, closePoll, deletePoll, decryptAndSubmitResults, getFinalResults } = contractHook;

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [voteEvents, setVoteEvents] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [isDecrypting, setIsDecrypting] = useState(false);

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
      
      let finalResults = [];
      try {
        const results = await getFinalResults(id);
        if (results && results.length > 0) {
          finalResults = results.map(r => Number(r));
          console.log('📊 Fetched final results:', finalResults);
        }
      } catch (error) {
        console.log('ℹ️ No final results yet (poll not decrypted)');
      }
      
      const pollState = {
        id: Number(id),
        question: pollData.question,
        options: pollData.options,
        creator: pollData.creator,
        endTime: Number(pollData.endTime),
        isActive: pollData.isActive,
        finalResults: finalResults
      };
      
      setPoll(pollState);
      setUserHasVoted(voted);
      
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

    if (isDecrypting) {
      toast.warning('Decryption already in progress...');
      return;
    }

    const toastId = toast.loading('Decrypting results...');
    setIsDecrypting(true);

    try {
      console.log('🔓 Starting decryption from UI...');
      
      const results = await decryptAndSubmitResults(id, poll.options.length);
      
      console.log('✅ Decryption completed, results:', results);
      
      toast.success(`Results decrypted! Total votes: ${results.reduce((a, b) => a + b, 0)}`, {
        id: toastId,
        duration: 5000
      });
      
      console.log('🔄 Refreshing poll data to display results...');
      await fetchPollData();
      
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      
      let errorMessage = 'Failed to decrypt results';
      
      if (error.message.includes('not initialized')) {
        errorMessage = 'FHEVM not ready. Please refresh the page.';
      } else if (error.message.includes('Invalid handle')) {
        errorMessage = 'Poll not properly closed. Try closing the poll again.';
      } else if (error.message.includes('proof')) {
        errorMessage = 'Verification failed. The decryption may have been tampered with.';
      } else if (error.message.includes('publicly decryptable')) {
        errorMessage = 'Poll not ready for decryption. Ensure it is closed first.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: toastId, duration: 7000 });
      
    } finally {
      setIsDecrypting(false);
    }
  };

  if (loading || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <LoadingSpinner size={40} />
        <p className="text-muted-foreground text-center">
          {!contract ? 'Initializing contract...' : 'Loading poll...'}
        </p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Poll not found</p>
            <Button onClick={() => navigate('/')} className="mt-4 w-full sm:w-auto">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPollExpired = currentTime >= poll.endTime;
  const isCreator = account && account.toLowerCase() === poll.creator.toLowerCase();

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 -ml-2 sm:ml-0"
          size="sm"
        >
          <ArrowLeft size={16} />
          <span className="text-sm sm:text-base">Back</span>
        </Button>

        {poll.isActive && !isPollExpired && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Poll Info Card - Mobile Optimized */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2 pr-2 break-words">
                {poll.question}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <User size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}</span>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={poll.isActive && !isPollExpired ? 'default' : 'secondary'}>
                {poll.isActive && !isPollExpired ? 'Active' : 'Ended'}
              </Badge>
              
              {isCreator && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
            <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{timeRemaining()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation - Mobile Friendly */}
      {showDeleteConfirm && (
        <Card className="mb-6 sm:mb-8 border-destructive">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-head text-lg sm:text-xl mb-2">Delete Poll?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              This action cannot be undone. All votes will be permanently deleted.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="destructive" onClick={handleDeletePoll} className="w-full sm:w-auto">
                Yes, Delete Poll
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid - Mobile Stacked, Desktop Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
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
            <CardContent className="p-4 sm:p-6">
              <p className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                Poll has ended - Close to prepare for decryption
              </p>
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
          isDecrypting={isDecrypting}
        />
      </div>
    </div>
  );
};