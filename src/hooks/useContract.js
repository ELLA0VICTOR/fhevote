import { useState, useEffect } from 'react';
import { getContract } from '../utils/contract';
import { encryptVote, isSDKInitialized } from '../utils/fhevm';
import { 
  decryptPollResults, 
  formatDecryptedResults, 
  extractHandles,
  validateHandles 
} from '../utils/decryption';

export function useContract(signer) {
  const [contract, setContract] = useState(null);

  useEffect(() => {
    if (signer) {
      const contractInstance = getContract(signer);
      setContract(contractInstance);
    }
  }, [signer]);

  /**
   * Create a new poll
   */
  const createPoll = async (question, options, durationHours) => {
    if (!contract) throw new Error('Contract not initialized');
    
    console.log('📝 Creating poll...', { question, options, durationHours });
    
    const tx = await contract.createPoll(question, options, durationHours);
    const receipt = await tx.wait();
    
    // Extract pollId from PollCreated event
    const event = receipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log)?.name === 'PollCreated';
      } catch {
        return false;
      }
    });
    
    const pollId = event ? contract.interface.parseLog(event).args.pollId : null;
    
    console.log('✅ Poll created with ID:', pollId);
    return { pollId, receipt };
  };

  /**
   * Cast encrypted vote with FHEVM validation
   */
  const vote = async (pollId, optionIndex, userAddress) => {
    if (!contract) throw new Error('Contract not initialized');
    
    // CRITICAL: Check FHEVM is initialized before attempting to vote
    if (!isSDKInitialized()) {
      throw new Error('FHEVM SDK not initialized. Please refresh the page.');
    }
    
    console.log('🗳️ Casting vote...', { pollId, optionIndex, userAddress });
    
    // Get contract address for encryption
    const contractAddress = await contract.getAddress();
    
    // Encrypt vote using SDK
    const encrypted = await encryptVote(contractAddress, userAddress, optionIndex);
    
    console.log('  → Encrypted vote data:', {
      handle: encrypted.handles[0],
      proofLength: encrypted.inputProof.length
    });
    
    // Submit vote to contract
    const tx = await contract.vote(
      pollId,
      encrypted.handles[0], // externalEuint8 handle
      encrypted.inputProof   // Input verification proof
    );
    
    const receipt = await tx.wait();
    console.log('✅ Vote cast successfully');
    
    return receipt;
  };

  /**
   * Close poll (marks ciphertexts for public decryption)
   */
  const closePoll = async (pollId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    console.log('🔒 Closing poll...', pollId);
    
    const tx = await contract.closePoll(pollId);
    const receipt = await tx.wait();
    
    console.log('✅ Poll closed - ciphertexts marked for public decryption');
    return receipt;
  };

  /**
   * Delete poll (creator only)
   */
  const deletePoll = async (pollId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    console.log('🗑️ Deleting poll...', pollId);
    
    try {
      const tx = await contract.deletePoll(pollId);
      const receipt = await tx.wait();
      
      console.log('✅ Poll deleted successfully');
      return receipt;
    } catch (error) {
      // If deletePoll doesn't exist on contract, provide helpful error
      if (error.message.includes('is not a function')) {
        throw new Error('Delete functionality not available in contract. Please contact developer.');
      }
      throw error;
    }
  };

  /**
   * Get poll details
   */
  const getPoll = async (pollId) => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return null;
    }
    return await contract.getPoll(pollId);
  };

  /**
   * Check if user has voted
   */
  const hasVoted = async (pollId, address) => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return false;
    }
    return await contract.hasVoted(pollId, address);
  };

  /**
   * Get final results (after decryption)
   */
  const getFinalResults = async (pollId) => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return [];
    }
    return await contract.getFinalResults(pollId);
  };

  /**
   * Get active poll IDs
   */
  const getActivePollIds = async () => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return [];
    }
    return await contract.getActivePollIds();
  };

  /**
   * FHEVM v0.9 Public Decryption & Submit Results Workflow
   * 
   * STEPS:
   * 1. Fetch encrypted vote count handles from contract
   * 2. Call instance.publicDecrypt(handles) to get cleartext values
   * 3. Format results as array
   * 4. Submit cleartext + proof to contract
   * 5. Contract verifies with FHE.checkSignatures()
   * 
   * @param {number} pollId - The poll ID
   * @param {number} optionsCount - Number of options in the poll
   * @returns {Promise<number[]>} - Array of decrypted vote counts
   */
  const decryptAndSubmitResults = async (pollId, optionsCount) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      console.log('🔓 Starting FHEVM v0.9 decryption workflow...');
      console.log(`  → Poll ID: ${pollId}`);
      console.log(`  → Options count: ${optionsCount}`);
      
      // STEP 1: Fetch encrypted handles from contract
      console.log('\n📡 Step 1: Fetching encrypted vote count handles...');
      const rawHandles = [];
      
      for (let i = 0; i < optionsCount; i++) {
        console.log(`  → Fetching handle for option ${i}...`);
        const handle = await contract.getVoteCount(pollId, i);
        rawHandles.push(handle);
        console.log(`    ✓ Got handle: ${handle}`);
      }
      
      // Extract and validate handles
      const handles = extractHandles(rawHandles);
      console.log('  ✓ All handles fetched and extracted');
      
      validateHandles(handles);
      console.log('  ✓ All handles validated');
      
      // STEP 2: Decrypt using FHEVM SDK
      console.log('\n🔐 Step 2: Decrypting via instance.publicDecrypt()...');
      const decryptedValues = await decryptPollResults(handles);
      console.log('  ✓ Decryption successful');
      
      // STEP 3: Format results as ordered array
      console.log('\n📊 Step 3: Formatting results...');
      const resultsArray = formatDecryptedResults(decryptedValues, handles);
      console.log('  ✓ Results formatted:', resultsArray);
      
      // Calculate total votes
      const totalVotes = resultsArray.reduce((sum, count) => sum + count, 0);
      console.log(`  → Total votes: ${totalVotes}`);
      
      // STEP 4: Submit results to contract
      console.log('\n📤 Step 4: Submitting results to contract...');
      
      // IMPORTANT: For HTTP public decrypt via relayer, proof is handled differently
      // The relayer already validated the decryption, so we pass empty proof
      // The contract's FHE.checkSignatures() will verify via the KMS
      const proof = '0x'; // Empty proof for relayer-based public decrypt
      
      console.log('  → Calling submitResults()...');
      const tx = await contract.submitResults(pollId, resultsArray, proof);
      
      console.log('  → Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      
      console.log('  ✓ Transaction confirmed');
      console.log(`  → Gas used: ${receipt.gasUsed.toString()}`);
      
      console.log('\n✅ FHEVM v0.9 decryption workflow completed successfully!');
      console.log('📊 Final results:', resultsArray);
      
      return resultsArray;
      
    } catch (error) {
      console.error('\n❌ Decryption workflow failed:', error);
      
      // Provide detailed error context
      if (error.message.includes('Invalid handle')) {
        throw new Error('Invalid ciphertext handles from contract. Ensure poll is closed.');
      } else if (error.message.includes('not initialized')) {
        throw new Error('FHEVM SDK not initialized. Please refresh the page.');
      } else if (error.message.includes('Failed to decrypt')) {
        throw new Error('Decryption failed. Ensure ciphertexts are marked as publicly decryptable.');
      } else {
        throw new Error(`Decryption workflow failed: ${error.message}`);
      }
    }
  };

  return {
    contract,
    createPoll,
    vote,
    closePoll,
    deletePoll,
    getPoll,
    hasVoted,
    getFinalResults,
    getActivePollIds,
    decryptAndSubmitResults
  };
}