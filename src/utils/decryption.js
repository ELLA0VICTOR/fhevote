/**
 * FHEVM v0.9 Public Decryption Workflow (Self-Relaying)
 * 
 * CRITICAL v0.9 WORKFLOW:
 * 1. Contract marks ciphertext as publicly decryptable: FHE.makePubliclyDecryptable()
 * 2. Client fetches ciphertext handles from contract
 * 3. Client calls instance.publicDecrypt(handles) - returns PublicDecryptResults object
 * 4. Client submits cleartext + decryptionProof back to contract
 * 5. Contract verifies with FHE.checkSignatures()
 * 
 * Docs: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption
 */

import { getFhevmInstance } from './fhevm';

/**
 * Decrypt poll results using FHEVM v0.9 public decryption
 * 
 * Per SDK docs: instance.publicDecrypt(handles) returns PublicDecryptResults:
 * {
 *   clearValues: Record<handle, bigint | boolean | hex>,
 *   abiEncodedClearValues: `0x${string}`,
 *   decryptionProof: `0x${string}`
 * }
 * 
 * @param {string[]} handlesList - Array of ciphertext handles (bytes32 hex strings)
 * @returns {Promise<PublicDecryptResults>} - Full decryption result object with proof
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
    const results = await instance.publicDecrypt(handlesList);
    
    console.log('  ✓ Decryption successful');
    console.log('  → Results structure:', {
      hasClearValues: !!results.clearValues,
      hasAbiEncoded: !!results.abiEncodedClearValues,
      hasProof: !!results.decryptionProof,
      clearValuesCount: Object.keys(results.clearValues || {}).length,
      proofLength: results.decryptionProof?.length
    });
    
    // Log individual decrypted values
    if (results.clearValues) {
      Object.entries(results.clearValues).forEach(([handle, value]) => {
        console.log(`    Handle ${handle.slice(0, 10)}... → ${value}`);
      });
    }
    
    // Verify we got all expected values
    if (!results.clearValues || Object.keys(results.clearValues).length !== handlesList.length) {
      throw new Error(
        `Incomplete decryption: expected ${handlesList.length} values, got ${Object.keys(results.clearValues || {}).length}`
      );
    }
    
    // Verify proof exists
    if (!results.decryptionProof || results.decryptionProof === '0x') {
      throw new Error('Decryption proof missing from results');
    }
    
    return results;
  } catch (error) {
    console.error('❌ Public decryption failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      handlesList
    });
    throw new Error(`Failed to decrypt results: ${error.message}`);
  }
}

/**
 * Format decrypted results for display
 * Converts SDK PublicDecryptResults.clearValues object to array matching poll options order
 * 
 * @param {Object} clearValues - clearValues from PublicDecryptResults (maps handles to bigints)
 * @param {string[]} handleOrder - Array of handles in the correct order
 * @returns {number[]} - Array of vote counts as numbers
 */
export function formatDecryptedResults(clearValues, handleOrder) {
  if (!clearValues || !handleOrder) {
    throw new Error('Invalid clearValues or handle order');
  }
  
  console.log('📊 Formatting decrypted results...');
  console.log('  → Handles order:', handleOrder.length);
  console.log('  → Clear values count:', Object.keys(clearValues).length);
  
  // Convert object to array in correct order
  const resultsArray = handleOrder.map((handle, index) => {
    const value = clearValues[handle];
    
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
  
  console.log(`  ✓ Extracted ${handles.length} handles`);
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