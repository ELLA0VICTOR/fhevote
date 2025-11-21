# FHEVOTE - Confidential Voting DApp

A production-ready decentralized voting application built with **Zama FHEVM v0.9** that ensures vote privacy through Fully Homomorphic Encryption.

## 🌟 Features

- **Fully Confidential Voting**: Individual votes remain encrypted until results are revealed
- **No Trusted Third Parties**: All operations happen on-chain
- **Verifiable Results**: Cryptographic proofs ensure result authenticity
- **Modern UI**: Neobrutalist design with RetroUI components

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 3 + RetroUI
- **Blockchain**: Zama FHEVM v0.9 (Sepolia Testnet)
- **Smart Contracts**: Solidity ^0.8.24

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Sepolia testnet ETH

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fhevote.git
cd fhevote
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Sepolia RPC URL and private key
```

4. Deploy smart contract:
```bash
npm run deploy-contract
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:5173

## 📖 Usage

### Creating a Poll

1. Connect your MetaMask wallet
2. Click "Create Poll"
3. Enter question and 2-5 options
4. Select poll duration (1hr to 7 days)
5. Confirm transaction

### Voting

1. Browse active polls
2. Click "Vote Now"
3. Select your option (vote is encrypted client-side)
4. Confirm transaction
5. Your vote remains private until reveal

### Revealing Results (Poll Creator)

1. Wait for poll to end
2. Click "Close Poll"
3. Click "Decrypt & Reveal Results"
4. Results are verified via KMS proof and displayed

## 🏗️ Project Structure

```
fhevote/
├── contracts/          # Solidity contracts
├── scripts/           # Deployment scripts
├── src/
│   ├── components/    # React components
│   │   ├── retroui/  # RetroUI design system
│   │   ├── polls/    # Poll-specific components
│   │   └── wallet/   # Wallet connection
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # FHEVM & contract utilities
│   └── pages/        # Main app pages
└── public/           # Static assets
```

## 🔐 How FHE Works

1. **Vote Encryption**: Votes are encrypted client-side using FHEVM SDK
2. **Homomorphic Counting**: Smart contract performs encrypted addition
3. **Public Decryption**: After poll closes, KMS decrypts with proof
4. **Verification**: Contract verifies decryption proof before revealing

## 📝 Smart Contract

Key functions:
- `createPoll()` - Create new poll
- `vote()` - Cast encrypted vote
- `closePoll()` - Mark poll for decryption
- `submitResults()` - Submit decrypted results with proof

## 🧪 Testing

```bash
# Run Hardhat tests
npx hardhat test

# Local blockchain
npx hardhat node
```

## 🚢 Deployment

### Frontend (Vercel)

```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Contract (Sepolia)

```bash
npm run deploy-contract
```

## 📄 License

MIT License - see LICENSE file

## 🏆 Built for Zama Developer Program

This project demonstrates production-ready use of Zama's FHEVM v0.9 for confidential on-chain voting.

## 🔗 Links
- [Demo Video]:(https://youtu.be/WCfWREt0Ftc)
- [Live Demo]:(https://fhevote-ten.vercel.app/)