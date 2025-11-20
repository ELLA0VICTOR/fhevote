import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { usePolls } from '../hooks/usePolls';
import { Button } from '../components/retroui/Button';
import { Badge } from '../components/retroui/Badge';
import { PollList } from '../components/polls/PollList';
import { Vote, Plus, Search, Lock, Zap, Target, Filter, RefreshCw } from 'lucide-react';

/**
 * Home Page - Main landing page with filters and poll list
 * 
 * FEATURES:
 * - Beautiful hero section with FHE benefits
 * - Filter tabs: All / Active / Ended / My Polls
 * - Shows ALL polls (persistent across page reloads)
 * - Auto-refresh support
 */
export const Home = () => {
  const navigate = useNavigate();
  const { signer, account, isConnected } = useWalletContext();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'active' | 'ended' | 'my-polls'
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch polls with current filter - NOW FETCHES ALL POLLS!
  const { polls, loading } = usePolls(signer, refreshTrigger, filterMode, account);

  // Refresh polls handler
  const refreshPolls = () => {
    console.log('🔄 Triggering poll list refresh...');
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    
    // Reset refreshing state after 1 second
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Check if we just came back from creating a poll
  useEffect(() => {
    const justCreated = sessionStorage.getItem('pollJustCreated');
    if (justCreated) {
      sessionStorage.removeItem('pollJustCreated');
      refreshPolls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter options configuration
  const filterOptions = [
    { 
      value: 'all', 
      label: 'All Polls',
      description: 'Show all existing polls'
    },
    { 
      value: 'active', 
      label: 'Active',
      description: 'Currently running polls'
    },
    { 
      value: 'ended', 
      label: 'Ended',
      description: 'Expired or closed polls'
    },
    { 
      value: 'my-polls', 
      label: 'My Polls',
      description: 'Polls you created',
      requiresAuth: true 
    }
  ];

  // Get empty message based on filter
  const getEmptyMessage = () => {
    switch (filterMode) {
      case 'active':
        return "No active polls right now. Create the first one!";
      case 'ended':
        return "No ended polls yet.";
      case 'my-polls':
        return "You haven't created any polls yet.";
      default:
        return "No polls yet. Be the first to create one!";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/20 to-background border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Vote size={80} className="mx-auto mb-6" />
          <h1 className="font-head text-5xl md:text-6xl mb-6">
            Vote in Secret.<br />Results in Public.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create confidential polls using Zama's Fully Homomorphic Encryption technology. 
            Your votes stay private until results are revealed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/create')}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Create Poll
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('polls')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2"
            >
              <Search size={20} />
              Browse Polls
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Lock className="w-8 h-8 text-primary mb-3" />,
              title: 'Fully Confidential',
              description: 'Individual votes are encrypted using FHE and remain private until reveal'
            },
            {
              icon: <Zap className="w-8 h-8 text-primary mb-3" />,
              title: 'No Intermediaries',
              description: 'All voting happens on-chain with no trusted third parties'
            },
            {
              icon: <Target className="w-8 h-8 text-primary mb-3" />,
              title: 'Verifiable Results',
              description: 'Decryption proofs ensure results are authentic and tamper-proof'
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-card border-2 border-border shadow-md p-6 hover:shadow-lg transition-shadow rounded-lg text-center"
            >
              <div className="flex flex-col items-center">
                {feature.icon}
                <h3 className="font-head text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Polls Section with Filters */}
      <section id="polls" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header with Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="font-head text-3xl mb-2">Browse Polls</h2>
            <p className="text-muted-foreground text-sm">
              All polls are stored permanently on the blockchain
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPolls}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={() => navigate('/create')}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              Create New Poll
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-card border-2 border-border shadow-md rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter Polls:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((option) => {
              // Hide "My Polls" if not connected
              if (option.requiresAuth && !isConnected) return null;

              const isActive = filterMode === option.value;

              return (
                <Button
                  key={option.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode(option.value)}
                  className="flex items-center gap-2"
                  title={option.description}
                >
                  {option.label}
                  {isActive && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {polls.length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Filter Description */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {filterOptions.find(o => o.value === filterMode)?.description}
            </p>
          </div>
        </div>

        {/* Poll List */}
        <PollList 
          polls={polls} 
          loading={loading}
          emptyMessage={getEmptyMessage()}
        />

       

        
      </section>
    </div>
  );
};