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

  const createPoll = async (question, options, durationMinutes) => {
    if (!contract) throw new Error('Contract not initialized');
    
    console.log('📝 Creating poll...', { question, options, durationMinutes });
    
    const tx = await contract.createPoll(question, options, durationMinutes);
    const receipt = await tx.wait();
    
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

  const vote = async (pollId, optionIndex, userAddress) => {
    if (!contract) throw new Error("Contract not initialized");
    if (!isSDKInitialized()) throw new Error("FHEVM SDK not initialized. Please refresh.");
  
    console.log("🗳️ Casting vote...", { pollId, optionIndex, userAddress });
  
    const contractAddress = await contract.getAddress();
    const encrypted = await encryptVote(contractAddress, userAddress, optionIndex);
  
    const toHex = (data) => {
      if (!data) throw new Error("Missing data to hexify");
      if (typeof data === "string" && data.startsWith("0x")) return data;
      if (data instanceof Uint8Array)
        return (
          "0x" +
          Array.from(data, (b) => b.toString(16).padStart(2, "0")).join("")
        );
      throw new Error("Unsupported data type for toHex(): " + typeof data);
    };
  
    const toFixed32 = (hex) => {
      if (!hex.startsWith("0x")) throw new Error("Missing 0x prefix");
      const clean = hex.slice(2);
      if (clean.length > 64) return "0x" + clean.slice(0, 64);
      return "0x" + clean.padEnd(64, "0");
    };
  
    const handleHex = toFixed32(toHex(encrypted.handles[0]));
    const proofHex = toHex(encrypted.inputProof);
    const pollIdNum = BigInt(pollId);
  
    const tx = await contract.vote(pollIdNum, handleHex, proofHex);
    const receipt = await tx.wait();
  
    console.log("✅ Vote cast successfully");
    return receipt;
  };
  
  const closePoll = async (pollId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    console.log('🔒 Closing poll...', pollId);
    
    const tx = await contract.closePoll(pollId);
    const receipt = await tx.wait();
    
    console.log('✅ Poll closed - ciphertexts marked for public decryption');
    return receipt;
  };

  const deletePoll = async (pollId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    console.log('🗑️ Deleting poll...', pollId);
    
    try {
      const tx = await contract.deletePoll(pollId);
      const receipt = await tx.wait();
      
      console.log('✅ Poll deleted successfully');
      return receipt;
    } catch (error) {
      if (error.message.includes('is not a function')) {
        throw new Error('Delete functionality not available in contract. Please contact developer.');
      }
      throw error;
    }
  };

  const getPoll = async (pollId) => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return null;
    }
    return await contract.getPoll(pollId);
  };

  const hasVoted = async (pollId, address) => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return false;
    }
    return await contract.hasVoted(pollId, address);
  };

  const getFinalResults = async (pollId) => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return [];
    }
    return await contract.getFinalResults(pollId);
  };

  const getAllPollIds = async () => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return [];
    }
    return await contract.getAllPollIds();
  };

  const getActivePollIds = async () => {
    if (!contract) {
      console.warn('⚠️ Contract not ready yet');
      return [];
    }
    return await contract.getActivePollIds();
  };

  /**
   * FHEVM v0.9 Public Decryption - FINAL FIX
   * 
   * KEY INSIGHT: SDK encodes euint32 as uint32, not uint256[]
   * Contract must decode as individual uint32 values matching the tuple structure
   */
  const decryptAndSubmitResults = async (pollId, optionsCount) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      console.log('🔓 Starting FHEVM v0.9 decryption workflow...');
      console.log(`  → Poll ID: ${pollId}`);
      console.log(`  → Options count: ${optionsCount}`);
      
      // STEP 1: Fetch handles
      console.log('\n📡 Step 1: Fetching encrypted vote count handles...');
      const rawHandles = [];
      
      for (let i = 0; i < optionsCount; i++) {
        console.log(`  → Fetching handle for option ${i}...`);
        const handle = await contract.getVoteCount(pollId, i);
        rawHandles.push(handle);
        console.log(`    ✓ Got handle: ${handle}`);
      }
      
      const handles = extractHandles(rawHandles);
      console.log('  ✓ All handles fetched and extracted');
      console.log('  → Handle order:', handles.map((h, i) => `${i}: ${h.slice(0, 10)}...`));
      
      validateHandles(handles);
      console.log('  ✓ All handles validated');
      
      // STEP 2: Decrypt via SDK
      console.log('\n🔐 Step 2: Calling instance.publicDecrypt()...');
      const decryptionResults = await decryptPollResults(handles);
      console.log('  ✓ Decryption successful');
      console.log('  → Got clearValues:', Object.keys(decryptionResults.clearValues).length);
      console.log('  → Got abiEncodedClearValues:', !!decryptionResults.abiEncodedClearValues);
      console.log('  → Got decryptionProof:', !!decryptionResults.decryptionProof);
      
      // STEP 3: Format for display
      console.log('\n📊 Step 3: Formatting results for display...');
      const resultsArray = formatDecryptedResults(decryptionResults.clearValues, handles);
      console.log('  ✓ Results formatted:', resultsArray);
      
      const totalVotes = resultsArray.reduce((sum, count) => sum + count, 0);
      console.log(`  → Total votes: ${totalVotes}`);
      
      // STEP 4: Verify SDK encoding
      console.log('\n🔍 Step 4: Verifying SDK encoding...');
      
      const abiEncodedResults = decryptionResults.abiEncodedClearValues;
      const proof = decryptionResults.decryptionProof;
      
      console.log('  → SDK abiEncodedClearValues length:', abiEncodedResults.length);
      console.log('  → Proof length:', proof.length);
      
      // Decode as individual uint32 values to verify
      const ethers = await import('ethers');
      let decodedNumbers;
      
      try {
        // Try decoding as tuple of uint32 values
        if (optionsCount === 2) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint32', 'uint32'], abiEncodedResults);
          decodedNumbers = decoded.map(v => Number(v));
        } else if (optionsCount === 3) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint32', 'uint32', 'uint32'], abiEncodedResults);
          decodedNumbers = decoded.map(v => Number(v));
        } else if (optionsCount === 4) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint32', 'uint32', 'uint32', 'uint32'], abiEncodedResults);
          decodedNumbers = decoded.map(v => Number(v));
        } else if (optionsCount === 5) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint32', 'uint32', 'uint32', 'uint32', 'uint32'], abiEncodedResults);
          decodedNumbers = decoded.map(v => Number(v));
        }
        
        console.log('  → Decoded as uint32 tuple:', decodedNumbers);
        
        const matches = decodedNumbers.every((val, idx) => val === resultsArray[idx]);
        console.log('  → Matches our formatted results:', matches);
        
        if (!matches) {
          console.error('  ❌ Mismatch detected!');
          console.error('    Decoded from SDK:', decodedNumbers);
          console.error('    Our formatted:', resultsArray);
          throw new Error('Result mismatch - possible ordering issue');
        }
      } catch (decodeError) {
        console.error('  ❌ Failed to decode as uint32 tuple:', decodeError);
        console.error('  → This suggests the SDK encoding format is different than expected');
        throw new Error(`Decoding verification failed: ${decodeError.message}`);
      }
      
      if (!proof || proof === '0x') {
        throw new Error('Invalid decryption proof from SDK');
      }
      
      console.log('\n📤 Step 5: Submitting to contract...');
      console.log('  → Calling contract.submitResults()...');
      console.log('    - Passing abiEncodedResults (uint32 tuple)');
      console.log('    - Passing decryptionProof from SDK');
      
      const tx = await contract.submitResults(pollId, abiEncodedResults, proof);
      
      console.log('  → Waiting for confirmation...');
      const receipt = await tx.wait();
      
      console.log('  ✓ Transaction confirmed!');
      console.log(`  → Gas used: ${receipt.gasUsed.toString()}`);
      
      console.log('\n✅ FHEVM v0.9 workflow complete with signature verification!');
      console.log('📊 Final results:', resultsArray);
      
      return resultsArray;
      
    } catch (error) {
      console.error('\n❌ Decryption workflow failed:', error);
      
      if (error.message.includes('Invalid handle')) {
        throw new Error('Invalid ciphertext handles. Ensure poll is closed.');
      } else if (error.message.includes('not initialized')) {
        throw new Error('FHEVM SDK not initialized. Please refresh.');
      } else if (error.message.includes('Failed to decrypt')) {
        throw new Error('Decryption failed. Ensure ciphertexts are publicly decryptable.');
      } else if (error.message.includes('checkSignatures') || error.message.includes('0x6475522d')) {
        console.error('\n🔍 Signature verification debug:');
        console.error('  - Handle order mismatch OR');
        console.error('  - Type mismatch (uint32 vs uint256)');
        throw new Error('Signature verification failed. See console for details.');
      } else if (error.message.includes('Invalid results length')) {
        throw new Error('Type mismatch: Contract expects tuple of uint32, check decoding.');
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
    getAllPollIds,
    getActivePollIds,
    decryptAndSubmitResults
  };
}