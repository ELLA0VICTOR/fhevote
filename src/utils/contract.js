import { ethers } from 'ethers';

export const CONTRACT_ABI = [
  "function createPoll(string memory question, string[] memory options, uint256 durationHours) external returns (uint)",
  "function vote(uint pollId, tuple(bytes data) encryptedOption, bytes calldata inputProof) external",
  "function closePoll(uint pollId) external",
  "function submitResults(uint pollId, uint256[] memory decryptedResults, bytes memory proof) external",
  "function getPoll(uint pollId) external view returns (string question, string[] options, address creator, uint256 endTime, bool isActive)",
  "function getVoteCount(uint pollId, uint optionIndex) external view returns (bytes32)",
  "function getFinalResults(uint pollId) external view returns (uint256[])",
  "function hasVoted(uint pollId, address voter) external view returns (bool)",
  "function getActivePollIds() external view returns (uint[])",
  "function pollCount() external view returns (uint)",
  "event PollCreated(uint indexed pollId, string question, address indexed creator, uint256 endTime)",
  "event VoteCast(uint indexed pollId, address indexed voter)",
  "event PollClosed(uint indexed pollId)",
  "event ResultsSubmitted(uint indexed pollId, uint256[] results)"
];

/**
 * Get deployed contract address
 * 
 * OPTION 1: Hardcoded address (simplest, works immediately)
 * OPTION 2: Use dynamic import (async)
 * OPTION 3: Use environment variable
 */

// OPTION 1: Hardcoded (RECOMMENDED for now)
const DEPLOYED_CONTRACT_ADDRESS = "0x20a5F96c115920e3CBDe14F3EFc0bE14e3304116";

export const getContractAddress = () => {
  // Use hardcoded address
  if (DEPLOYED_CONTRACT_ADDRESS) {
    return DEPLOYED_CONTRACT_ADDRESS;
  }
  
  // Fallback: check environment variable
  if (import.meta.env.VITE_CONTRACT_ADDRESS) {
    return import.meta.env.VITE_CONTRACT_ADDRESS;
  }
  
  console.warn('⚠️ No contract address configured!');
  console.warn('Add VITE_CONTRACT_ADDRESS to .env or update DEPLOYED_CONTRACT_ADDRESS in contract.js');
  return null;
};

/**
 * Get contract instance
 * @param {Signer | Provider} signerOrProvider - Ethers signer or provider
 * @returns {Contract | null}
 */
export const getContract = (signerOrProvider) => {
  const address = getContractAddress();
  
  if (!address) {
    console.error('❌ Contract address not found');
    return null;
  }
  
  if (!signerOrProvider) {
    console.warn('⚠️ No signer or provider provided to getContract');
    return null;
  }
  
  return new ethers.Contract(address, CONTRACT_ABI, signerOrProvider);
};

/**
 * Async version that loads from contractConfig.json
 * Use this if you want to dynamically load the config file
 */
export const getContractAddressAsync = async () => {
  try {
    // Vite supports JSON imports
    const config = await import('./contractConfig.json');
    return config.default?.contractAddress || config.contractAddress;
  } catch (error) {
    console.warn('Failed to load contractConfig.json:', error.message);
    return DEPLOYED_CONTRACT_ADDRESS; // Fallback to hardcoded
  }
};