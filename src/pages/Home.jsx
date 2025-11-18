import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { usePolls } from '../hooks/usePolls';
import { Button } from '../components/retroui/Button';
import { PollList } from '../components/polls/PollList';
import { Vote, Plus, Search, Lock, Zap, Target } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const { signer } = useWalletContext();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Pass refreshTrigger to usePolls
  const { polls, loading } = usePolls(signer, refreshTrigger);

  // This function can be called from child components or after actions
  const refreshPolls = () => {
    console.log('🔄 Triggering poll list refresh...');
    setRefreshTrigger(prev => prev + 1);
  };

  // Check if we just came back from creating a poll
  useEffect(() => {
    const justCreated = sessionStorage.getItem('pollJustCreated');
    if (justCreated) {
      sessionStorage.removeItem('pollJustCreated');
      refreshPolls();
    }
  }, []);

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
              onClick={() => document.getElementById('polls').scrollIntoView({ behavior: 'smooth' })}
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

      {/* Active Polls Section */}
      <section id="polls" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-head text-3xl">Active Polls</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/create')}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Create New Poll
          </Button>
        </div>
        <PollList polls={polls} loading={loading} />
      </section>
    </div>
  );
};