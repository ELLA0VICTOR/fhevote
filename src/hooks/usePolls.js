import { useState, useEffect } from 'react';
import { useContract } from './useContract';

/**
 * ✅ UPDATED: Fetches ALL polls (active + ended + closed)
 * Allows filtering/sorting in UI components
 * 
 * @param {object} signer - Ethers signer
 * @param {number} refreshTrigger - Counter to trigger refetch
 * @param {string} filterMode - 'all' | 'active' | 'ended' | 'my-polls'
 * @param {string} userAddress - Current user's address (for 'my-polls' filter)
 */
export function usePolls(signer, refreshTrigger = 0, filterMode = 'all', userAddress = null) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const contractHook = useContract(signer);
  const { contract, getAllPollIds, getPoll, getFinalResults } = contractHook;

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
      
      console.log('📡 Fetching ALL polls from blockchain...');
      
      // ✅ NEW: Fetch ALL existing polls (not just active)
      const pollIds = await getAllPollIds();
      
      if (!pollIds || pollIds.length === 0) {
        console.log('  ✓ No polls found on blockchain');
        setPolls([]);
        return;
      }
      
      console.log(`  → Found ${pollIds.length} poll(s) on blockchain`);

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
            
            // Calculate if poll is expired
            const now = Date.now() / 1000;
            const isPollExpired = now >= Number(poll.endTime);
            
            return {
              id: Number(id),
              question: poll.question,
              options: poll.options,
              creator: poll.creator,
              endTime: Number(poll.endTime),
              isActive: poll.isActive,
              isExpired: isPollExpired,
              finalResults: results && results.length > 0 ? results.map(Number) : null
            };
          } catch (pollError) {
            console.error(`  ❌ Failed to fetch poll ${id}:`, pollError.message);
            return null;
          }
        })
      );
      
      // Filter out any failed polls
      let validPolls = pollsData.filter(p => p !== null);
      
      // Apply filtering based on filterMode
      if (filterMode === 'active') {
        validPolls = validPolls.filter(p => p.isActive && !p.isExpired);
        console.log(`  → Filtered to ${validPolls.length} active poll(s)`);
      } else if (filterMode === 'ended') {
        validPolls = validPolls.filter(p => !p.isActive || p.isExpired);
        console.log(`  → Filtered to ${validPolls.length} ended poll(s)`);
      } else if (filterMode === 'my-polls' && userAddress) {
        validPolls = validPolls.filter(
          p => p.creator.toLowerCase() === userAddress.toLowerCase()
        );
        console.log(`  → Filtered to ${validPolls.length} poll(s) created by you`);
      }
      
      // Sort: Active polls first, then by end time (newest first)
      validPolls.sort((a, b) => {
        // Active polls always come first
        if (a.isActive && !a.isExpired && (b.isExpired || !b.isActive)) return -1;
        if (b.isActive && !b.isExpired && (a.isExpired || !a.isActive)) return 1;
        
        // Within same status, sort by end time (newest first)
        return b.endTime - a.endTime;
      });
      
      console.log(`✅ Successfully fetched and sorted ${validPolls.length} poll(s)`);
      
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
  }, [signer, refreshTrigger, contract, filterMode, userAddress]);

  return { 
    polls, 
    loading, 
    error,
    refetch: fetchPolls 
  };
}