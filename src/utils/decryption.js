/**
 * FHEVM v0.9 Public Decryption Workflow (Self-Relaying)
 * 
 * CRITICAL v0.9 WORKFLOW:
 * 1. Contract marks ciphertext as publicly decryptable: FHE.makePubliclyDecryptable()
 * 2. Client fetches ciphertext handles from contract
 * 3. Client calls instance.publicDecrypt(handles) - returns cleartext values
 * 4. Client submits cleartext back to contract with proof
 * 5. Contract verifies with FHE.checkSignatures()
 * 
 * NO BACKEND MICROSERVICE - Direct SDK usage!
 * 
 * Docs: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption
 */

import { getFhevmInstance } from './fhevm';

/**
 * Decrypt poll results using FHEVM v0.9 public decryption
 * 
 * Per SDK docs: instance.publicDecrypt(handles) returns object mapping handles to values
 * 
 * @param {string[]} handlesList - Array of ciphertext handles (bytes32 hex strings)
 * @returns {Promise<{[handle: string]: bigint}>} - Object mapping handles to decrypted values
 */
export async function decryptPollResults(handlesList) {
  try {
    console.log('🔓 Starting v0.9 public decryption...');
    console.log(`  → Handles to decrypt: ${handlesList.length}`);
    
    if (!handlesList || handlesList.length === 0) {
      throw new Error('No handles provided for decryption');
    }
    
    // Validate handle format (must be 32-byte hex strings)
    for (const handle of handlesList) {
      if (!handle || typeof handle !== 'string') {
        throw new Error(`Invalid handle format: ${handle}`);
      }
      // Remove 0x prefix if present for validation
      const cleanHandle = handle.startsWith('0x') ? handle.slice(2) : handle;
      if (cleanHandle.length !== 64) {
        throw new Error(`Invalid handle length: ${handle} (expected 64 hex chars)`);
      }
    }
    
    console.log('  ✓ Handle validation passed');
    
    // Get FHEVM instance
    const instance = getFhevmInstance();
    
    // Call SDK public decrypt method
    console.log('  → Calling instance.publicDecrypt()...');
    const decryptedValues = await instance.publicDecrypt(handlesList);
    
    console.log('  ✓ Decryption successful');
    console.log('  → Decrypted values:', decryptedValues);
    
    // SDK returns object like:
    // {
    //   '0x830a61...': 5n,
    //   '0x98ee52...': 12n,
    //   '0xb837a6...': 3n
    // }
    
    return decryptedValues;
  } catch (error) {
    console.error('❌ Public decryption failed:', error);
    throw new Error(`Failed to decrypt results: ${error.message}`);
  }
}

/**
 * Format decrypted results for display
 * Converts SDK response object to array matching poll options order
 * 
 * @param {Object} decryptionResult - Object from publicDecrypt() mapping handles to bigints
 * @param {string[]} handleOrder - Array of handles in the correct order
 * @returns {number[]} - Array of vote counts as numbers
 */
export function formatDecryptedResults(decryptionResult, handleOrder) {
  if (!decryptionResult || !handleOrder) {
    throw new Error('Invalid decryption result or handle order');
  }
  
  console.log('📊 Formatting decrypted results...');
  
  // Convert object to array in correct order
  const resultsArray = handleOrder.map((handle, index) => {
    const value = decryptionResult[handle];
    
    if (value === undefined) {
      console.warn(`⚠️ No value found for handle ${handle}, using 0`);
      return 0;
    }
    
    // Convert BigInt to Number for display
    const numValue = typeof value === 'bigint' ? Number(value) : (value || 0);
    console.log(`  → Option ${index}: ${numValue} votes`);
    
    return numValue;
  });
  
  console.log('  ✓ Results formatted:', resultsArray);
  return resultsArray;
}

/**
 * Extract ciphertext handles from contract response
 * Handles can come in various formats from ethers.js
 * 
 * @param {Array} voteCountCiphertexts - Array of ciphertext responses from contract
 * @returns {string[]} - Array of handle strings (with 0x prefix)
 */
export function extractHandles(voteCountCiphertexts) {
  console.log('🔍 Extracting handles from contract data...');
  
  const handles = voteCountCiphertexts.map((ct, index) => {
    let handle;
    
    // Handle different response formats
    if (typeof ct === 'string') {
      handle = ct;
    } else if (ct.data) {
      handle = ct.data;
    } else if (ct._hex) {
      handle = ct._hex;
    } else {
      handle = ct.toString();
    }
    
    // Ensure 0x prefix
    if (!handle.startsWith('0x')) {
      handle = '0x' + handle;
    }
    
    console.log(`  → Handle ${index}: ${handle}`);
    return handle;
  });
  
  console.log('  ✓ Extracted', handles.length, 'handles');
  return handles;
}

/**
 * Validate that all handles are properly formatted
 */
export function validateHandles(handles) {
  for (const handle of handles) {
    if (!handle || typeof handle !== 'string') {
      throw new Error(`Invalid handle: ${handle}`);
    }
    
    const cleanHandle = handle.startsWith('0x') ? handle.slice(2) : handle;
    if (cleanHandle.length !== 64) {
      throw new Error(`Invalid handle length: ${handle}`);
    }
  }
  
  return true;
}