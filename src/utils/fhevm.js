/**
 * FHEVM v0.9 Initialization with @zama-fhe/relayer-sdk v0.3.0-5+ (CDN Bundle)
 * 
 * Using CDN bundle to avoid npm package resolution issues
 * Per docs: https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webapp
 * 
 * CRITICAL WORKFLOW:
 * 1. SDK loaded via <script> tag in index.html
 * 2. Access via window.fhevm global
 * 3. Call window.fhevm.initSDK() to load WASM
 * 4. Call window.fhevm.createInstance() with config
 */

let fhevmInstance = null;
let isInitialized = false;

/**
 * FHEVM v0.9 Sepolia Configuration
 * Source: https://docs.zama.ai/protocol/solidity-guides/smart-contract/configure/contract_addresses
 */
const SEPOLIA_V09_CONFIG = {
  // ACL_CONTRACT_ADDRESS (FHEVM Host chain - Sepolia)
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  
  // KMS_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain - Sepolia)
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  
  // INPUT_VERIFIER_CONTRACT_ADDRESS (FHEVM Host chain - Sepolia)
  inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
  
  // DECRYPTION_ADDRESS (Gateway chain)
  verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
  
  // INPUT_VERIFICATION_ADDRESS (Gateway chain)
  verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
  
  // FHEVM Host chain id (Sepolia)
  chainId: 11155111,
  
  // Gateway chain id (v0.9)
  gatewayChainId: 10901,
  
  // Relayer URL
  relayerUrl: 'https://relayer.testnet.zama.org',
};

/**
 * Check if SDK is loaded from CDN
 */
function checkSDKLoaded() {
  if (typeof window === 'undefined') {
    throw new Error('Must run in browser environment');
  }
  
  if (!window.fhevm) {
    throw new Error(
      'FHEVM SDK not loaded! Add this to index.html:\n' +
      '<script src="https://cdn.zama.ai/relayer-sdk-js/0.3.0/relayer-sdk-js.umd.cjs"></script>'
    );
  }
}

/**
 * Initialize FHEVM SDK
 * MUST be called before any other FHEVM operations
 * 
 * @returns {Promise<FhevmInstance>}
 */
export async function initFhevm() {
  if (fhevmInstance && isInitialized) {
    console.log('✓ FHEVM already initialized, returning existing instance');
    return fhevmInstance;
  }
  
  try {
    console.log('🔧 Initializing FHEVM SDK v0.9 (CDN)...');
    
    // Check SDK is loaded
    checkSDKLoaded();
    
    // Step 1: Load WASM (CRITICAL - must be first!)
    console.log('  → Loading TFHE WASM...');
    await window.fhevm.initSDK();
    console.log('  ✓ TFHE WASM loaded successfully');
    
    // Step 2: Create instance with Sepolia v0.9 config
    console.log('  → Creating FHEVM instance...');
    
    const config = {
      ...SEPOLIA_V09_CONFIG,
      // Use MetaMask provider if available, otherwise fallback to public RPC
      network: window.ethereum || 'https://sepolia.infura.io/v3/d05efcb7210a474e8b98308181a49685',
    };
    
    fhevmInstance = await window.fhevm.createInstance(config);
    isInitialized = true;
    
    console.log('  ✓ FHEVM instance created successfully');
    console.log('✅ FHEVM SDK v0.9 initialized');
    
    return fhevmInstance;
  } catch (error) {
    console.error('❌ FHEVM initialization failed:', error);
    isInitialized = false;
    fhevmInstance = null;
    throw new Error(`FHEVM initialization failed: ${error.message}`);
  }
}

/**
 * Get current FHEVM instance (must call initFhevm first)
 * @throws {Error} If FHEVM not initialized
 */
export function getFhevmInstance() {
  if (!fhevmInstance || !isInitialized) {
    throw new Error('FHEVM not initialized. Call initFhevm() first.');
  }
  return fhevmInstance;
}

/**
 * Encrypt a vote option for submission
 * 
 * Workflow per SDK docs:
 * 1. Create encrypted input buffer with createEncryptedInput()
 * 2. Add value with appropriate type method (add8 for uint8)
 * 3. Call encrypt() to get handles and proof
 * 
 * @param {string} contractAddress - The poll contract address
 * @param {string} userAddress - The voter's address
 * @param {number} optionIndex - The selected option (0-4)
 * @returns {Promise<{handles: string[], inputProof: string}>}
 */
export async function encryptVote(contractAddress, userAddress, optionIndex) {
  try {
    console.log(`🔐 Encrypting vote: option ${optionIndex}`);
    
    const instance = getFhevmInstance();
    
    // Step 1: Create encrypted input buffer
    const buffer = instance.createEncryptedInput(contractAddress, userAddress);
    
    // Step 2: Add the vote option as euint8 (matches contract's externalEuint8)
    buffer.add8(BigInt(optionIndex));
    
    // Step 3: Encrypt and generate proof
    console.log('  → Encrypting and generating proof...');
    const encryptedData = await buffer.encrypt();
    
    console.log('  ✓ Vote encrypted successfully');
    console.log('  → Handles:', encryptedData.handles);
    console.log('  → Proof length:', encryptedData.inputProof.length);
    
    return {
      handles: encryptedData.handles,
      inputProof: encryptedData.inputProof
    };
  } catch (error) {
    console.error('❌ Vote encryption failed:', error);
    throw new Error(`Vote encryption failed: ${error.message}`);
  }
}

/**
 * Check if FHEVM is initialized
 */
export function isSDKInitialized() {
  return isInitialized && fhevmInstance !== null;
}

/**
 * Reset FHEVM instance (for testing purposes)
 */
export function resetFhevmInstance() {
  console.warn('⚠️ Resetting FHEVM instance');
  fhevmInstance = null;
  isInitialized = false;
}