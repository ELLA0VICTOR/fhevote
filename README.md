# FHEVOTE - Confidential On-Chain Voting

A decentralized voting application leveraging Zama FHEVM v0.9 to ensure complete vote privacy through Fully Homomorphic Encryption on Ethereum's Sepolia testnet.

## What Makes This Different?

Traditional blockchain voting systems face a fundamental privacy paradox: votes are either stored on a centralized server requiring trust, or they are publicly visible on-chain. FHEVOTE solves this with homomorphic encryption technology:

- Votes are encrypted client-side before submission - no one can see individual choices
- Vote tallying occurs on encrypted data - the smart contract never sees plaintext votes
- Results are verifiable through cryptographic proofs - no manipulation possible
- Decryption happens only after polls close - using Zama's KMS infrastructure

## Tech Stack

**Smart Contracts:**
- Solidity ^0.8.24
- FHEVM v0.9 (Zama's Fully Homomorphic Encryption)
- Hardhat for development and testing

**Frontend:**
- React 19 with Vite
- Tailwind CSS 3 for styling
- Ethers.js v6 for blockchain interaction
- Custom RetroUI component library

## Getting Started

### Prerequisites

You'll need:

- Node.js v18 or higher
- MetaMask browser extension
- Sepolia testnet ETH (available from [Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd fhevote

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Wallet private key for contract deployment
PRIVATE_KEY=0x...

# Sepolia RPC endpoint (optional, uses public endpoint by default)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Contract address (will be populated after deployment)
VITE_CONTRACT_ADDRESS=

# Etherscan API key for contract verification (optional)
ETHERSCAN_API_KEY=your_api_key_here
```

**Important:** Never commit your `.env` file. It is already included in `.gitignore`.

### Deploy the Smart Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

After deployment, copy the contract address from the output and update:

1. `.env` → `VITE_CONTRACT_ADDRESS=0xABC123...`
2. `src/utils/contract.js` → `const DEPLOYED_CONTRACT_ADDRESS = "0xABC123..."`

### Run the Frontend

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## How It Works

### Creating a Poll

1. Connect your MetaMask wallet to Sepolia testnet
2. Navigate to "Create Poll"
3. Configure:
   - Poll question
   - 2-5 voting options
   - Poll duration (1 hour to 7 days)
4. Confirm the transaction
5. Share the poll with participants

### Voting

1. Browse active polls on the home page
2. Select a poll to view details
3. Choose your option
4. Click "Vote Now" - your selection is encrypted locally using FHEVM
5. Confirm the transaction in MetaMask

Your vote is encrypted before leaving your browser. No one, including the poll creator, can see your choice until results are revealed.

### Revealing Results (Poll Creator Only)

After the poll closes, the creator must execute a three-step process:

1. **Close Poll** - Marks the poll as ended
2. **Decrypt Results** - Requests decryption from the KMS gateway
3. **Submit Results** - Submits decrypted values with cryptographic proof to the contract

The contract verifies the decryption proof using `FHE.checkSignatures()` before accepting the results, ensuring that revealed vote counts are authentic and untampered.

## Project Structure

```
fhevote/
├── contracts/              # Solidity smart contracts
│   └── SecretBallot.sol
├── scripts/                # Deployment scripts
│   └── deploy.js
├── src/
│   ├── components/
│   │   ├── retroui/       # Custom UI component library
│   │   ├── layout/        # Navigation and footer components
│   │   ├── wallet/        # Wallet connection logic
│   │   ├── polls/         # Poll-specific components
│   │   └── common/        # Shared components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   │   ├── fhevm.js       # FHEVM initialization and encryption
│   │   ├── decryption.js  # Off-chain decryption workflow
│   │   ├── contract.js    # Contract interaction helpers
│   │   └── cn.js          # Classname utility
│   ├── context/           # React context providers
│   ├── pages/             # Main application pages
│   ├── App.jsx            # Application root
│   └── main.jsx           # Entry point
├── hardhat.config.js      # Hardhat configuration
└── package.json
```

## The Encryption Process

Here's what happens during the voting workflow:

1. **Client-side encryption:** Your browser encrypts your vote using the FHEVM SDK
2. **Proof generation:** A cryptographic proof is created to verify the encryption
3. **On-chain storage:** The contract stores the encrypted vote and proof
4. **Homomorphic tallying:** The contract increments encrypted counters without decrypting
5. **KMS decryption:** After poll closes, the creator requests decryption from Zama's KMS
6. **Proof verification:** The contract verifies the decryption proof before accepting results

This design ensures:

- No one can see individual votes before the poll closes
- Votes cannot be changed after submission
- All operations are verifiable on-chain
- No trust is required in the poll creator or any third party

## Testing

```bash
# Run all tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Generate coverage report
npx hardhat coverage
```

## Troubleshooting

### "FHEVM SDK not loaded"

Ensure `index.html` includes the FHEVM CDN script:

```html
<script src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"></script>
```

### "Wrong Network"

Switch MetaMask to Sepolia testnet. If you don't see Sepolia:

1. Open MetaMask Settings
2. Navigate to Advanced
3. Enable "Show test networks"

### "Insufficient funds"

Obtain free Sepolia ETH from [https://sepoliafaucet.com](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

### Decryption Fails

Verify the following sequence:

1. Called `closePoll()` on the contract
2. Waited a few seconds for state changes to propagate
3. Called the decryption function from the UI
4. Submitted results with the decryption proof

## Security Considerations

- **Private keys:** Never share or commit your private key to version control
- **Testnet only:** This deployment is for Sepolia testnet - do not use with real funds
- **Encryption:** FHEVM provides computational privacy, not transaction anonymity
- **Randomness:** Contract uses `block.prevrandao` for random number generation - suitable for testnet, but production deployments should consider VRF solutions

## Known Limitations

- Sepolia testnet deployment only (mainnet requires security audit)
- FHEVM initialization takes 2-3 seconds on first page load
- Gas costs are higher than standard transactions due to encryption operations
- Maximum of 5 options per poll (configurable in contract)

## Future Improvements

- Support for weighted voting mechanisms
- Scheduled polls with automatic closure
- Delegation and proxy voting
- Integration with ENS for voter identification
- Mobile application support
- Multi-signature poll creation for organizational voting

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

## Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

## License

MIT License - see LICENSE file for details.

## Acknowledgments

Built with FHEVM technology by Zama. This project demonstrates the practical application of fully homomorphic encryption for privacy-preserving blockchain applications.

**Note:** This is a testnet demonstration for educational purposes. Do not deploy to mainnet without a comprehensive security audit.
