import { useState, useEffect } from 'react';
import { useContract } from './useContract';

export function usePolls(signer, refreshTrigger = 0) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const contractHook = useContract(signer);
  const { contract, getActivePollIds, getPoll, getFinalResults } = contractHook;

  const fetchPolls = async () => {
    // Don't fetch if no signer
    if (!signer) {
      console.log('⏸️ No signer, skipping poll fetch');
      setLoading(false);
      setPolls([]);
      return;
    }

    // Don't fetch if contract not ready
    if (!contract) {
      console.log('⏸️ Contract not ready yet, skipping poll fetch');
      setLoading(false);
      setPolls([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching active polls...');
      const pollIds = await getActivePollIds();
      
      if (!pollIds || pollIds.length === 0) {
        console.log('  ✓ No active polls found');
        setPolls([]);
        return;
      }
      
      console.log(`  → Found ${pollIds.length} active poll(s)`);

      const pollsData = await Promise.all(
        pollIds.map(async (id) => {
          try {
            console.log(`  → Fetching poll ${id}...`);
            const poll = await getPoll(id);
            
            if (!poll) {
              console.warn(`  ⚠️ Poll ${id} returned null`);
              return null;
            }
            
            const results = await getFinalResults(id);
            
            return {
              id: Number(id),
              question: poll.question,
              options: poll.options,
              creator: poll.creator,
              endTime: Number(poll.endTime),
              isActive: poll.isActive,
              finalResults: results && results.length > 0 ? results.map(Number) : null
            };
          } catch (pollError) {
            console.error(`  ❌ Failed to fetch poll ${id}:`, pollError.message);
            return null;
          }
        })
      );
      
      // Filter out any failed polls
      const validPolls = pollsData.filter(p => p !== null);
      console.log(`✅ Successfully fetched ${validPolls.length} poll(s)`);
      
      setPolls(validPolls);
    } catch (error) {
      console.error('❌ Failed to fetch polls:', error.message);
      setError(error.message);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, refreshTrigger, contract]);

  return { 
    polls, 
    loading, 
    error,
    refetch: fetchPolls 
  };
}