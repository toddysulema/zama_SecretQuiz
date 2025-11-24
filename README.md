# SecretQuiz 🔐

A privacy-preserving knowledge quiz platform built on Ethereum using Fully Homomorphic Encryption (FHE) via FHEVM. SecretQuiz allows users to prove their knowledge without revealing their answers, ensuring complete privacy while maintaining verifiable results on the blockchain.

## ✨ Features

- **🔒 Privacy-Preserving**: Answers and scores are encrypted using FHEVM, ensuring they remain private
- **📝 Quiz Creation**: Create quizzes with multiple questions and encrypted answers
- **🎯 Multiple Categories**: Support for Technology, Science, Business, and Custom categories
- **📊 Score Verification**: Verify quiz scores without revealing actual answers
- **🏆 Reward System**: Earn points for passing quizzes
- **🌐 Web3 Integration**: Full MetaMask wallet integration with EIP-6963 support
- **🎨 Modern UI**: Beautiful, responsive interface with dark mode support

## 🏗️ Architecture

This project consists of two main components:

1. **Smart Contracts** (`fhevm-hardhat-template/`): FHEVM-enabled Solidity contracts for quiz management
2. **Frontend** (`secretquiz-frontend/`): Next.js-based web application with FHEVM integration

## 📋 Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **MetaMask**: Browser extension for wallet connectivity
- **Hardhat Node** (for local development): For running local FHEVM-enabled blockchain

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/toddysulema/zama_SecretQuiz.git
cd zama_SecretQuiz
```

### 2. Install Dependencies

#### Smart Contracts

```bash
cd fhevm-hardhat-template
npm install
```

#### Frontend

```bash
cd ../secretquiz-frontend
npm install
```

### 3. Set Up Environment Variables

#### For Smart Contracts

```bash
cd fhevm-hardhat-template

# Set your mnemonic phrase
npx hardhat vars set MNEMONIC

# Set your Infura API key for network access
npx hardhat vars set INFURA_API_KEY

# Optional: Set Etherscan API key for contract verification
npx hardhat vars set ETHERSCAN_API_KEY
```

### 4. Deploy Contracts

#### Local Development

```bash
# Terminal 1: Start local Hardhat node
cd fhevm-hardhat-template
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost
```

#### Sepolia Testnet

```bash
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

### 5. Run Frontend

#### With Mock FHEVM (Local Development)

```bash
cd secretquiz-frontend
npm run dev:mock
```

This will:
- Check if Hardhat node is running
- Generate ABI and address mappings
- Start Next.js dev server with mock FHEVM utils

#### With Real Relayer SDK (Testnet/Mainnet)

```bash
cd secretquiz-frontend
npm run dev
```

This will:
- Generate ABI and address mappings
- Start Next.js dev server with real FHEVM relayer SDK

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
zama_SecretQuiz/
├── fhevm-hardhat-template/      # Smart contracts and Hardhat configuration
│   ├── contracts/               # Solidity smart contracts
│   │   ├── SecretQuiz.sol      # Main quiz contract
│   │   └── FHECounter.sol      # Example FHEVM contract
│   ├── deploy/                  # Deployment scripts
│   ├── test/                    # Test files
│   ├── tasks/                   # Hardhat custom tasks
│   └── hardhat.config.ts        # Hardhat configuration
│
├── secretquiz-frontend/         # Next.js frontend application
│   ├── app/                     # Next.js app router pages
│   │   ├── page.tsx             # Homepage
│   │   ├── create/              # Quiz creation page
│   │   ├── quizzes/             # Quiz listing page
│   │   ├── quiz/[id]/           # Quiz taking page
│   │   ├── results/[id]/        # Results page
│   │   └── my-quizzes/          # User's quizzes page
│   ├── components/             # React components
│   ├── fhevm/                   # FHEVM integration
│   │   ├── internal/            # Internal FHEVM utilities
│   │   │   ├── fhevm.ts        # FHEVM instance management
│   │   ├── RelayerSDKLoader.ts # Relayer SDK loader
│   │   └── useFhevm.tsx        # React hook for FHEVM
│   ├── hooks/                   # Custom React hooks
│   │   ├── metamask/            # MetaMask integration hooks
│   │   └── useSecretQuiz.tsx   # Quiz interaction hook
│   └── scripts/                 # Build and utility scripts
│       ├── genabi.mjs          # ABI generation script
│       └── check-static.mjs    # Static export validation
│
└── README.md                    # This file
```

## 🛠️ Development

### Smart Contracts

#### Compile Contracts

```bash
cd fhevm-hardhat-template
npm run compile
```

#### Run Tests

```bash
# Local tests (with mock FHEVM)
npm run test

# Sepolia testnet tests
npm run test:sepolia
```

#### Run Linting

```bash
npm run lint
```

### Frontend

#### Development Mode

```bash
cd secretquiz-frontend

# With mock FHEVM (requires local Hardhat node)
npm run dev:mock

# With real relayer SDK
npm run dev
```

#### Build for Production

```bash
npm run build
```

The static export will be generated in the `out/` directory.

#### Check Static Export

```bash
npm run check:static
```

This validates that the project is configured for static export and doesn't contain any server-side code.

## 🔐 How It Works

### Privacy-Preserving Quiz Flow

1. **Quiz Creation**: Quiz creators define questions and correct answers, which are encrypted using FHEVM
2. **Quiz Taking**: Participants answer questions, with their answers encrypted before submission
3. **Score Calculation**: Scores are calculated homomorphically on encrypted data
4. **Result Verification**: Results can be verified on-chain without revealing actual answers
5. **Reward Claiming**: Participants can claim rewards based on their encrypted scores

### FHEVM Integration

- **Local Development**: Uses `@fhevm/mock-utils` for testing without a relayer
- **Testnet/Mainnet**: Uses `@zama-fhe/relayer-sdk` for real FHEVM operations
- **Wallet Integration**: Full MetaMask support with automatic reconnection and chain switching

## 📚 Available Scripts

### Smart Contracts (`fhevm-hardhat-template/`)

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run all tests |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run coverage` | Generate coverage report |
| `npm run lint` | Run linting checks |
| `npm run clean` | Clean build artifacts |

### Frontend (`secretquiz-frontend/`)

| Script | Description |
|--------|-------------|
| `npm run dev:mock` | Start dev server with mock FHEVM |
| `npm run dev` | Start dev server with real relayer SDK |
| `npm run build` | Build for production (static export) |
| `npm run check:static` | Validate static export configuration |
| `npm run genabi` | Generate ABI and address mappings |
| `npm run lint` | Run linting checks |

## 🌐 Network Configuration

### Supported Networks

- **Localhost**: For local development with Hardhat node
- **Sepolia**: Ethereum testnet with FHEVM support

### Network Setup

The project automatically detects the network and uses the appropriate FHEVM mode:
- `chainId: 31337` (localhost) → Mock FHEVM
- Other networks → Real Relayer SDK

## 🔧 Configuration

### Hardhat Configuration

Edit `fhevm-hardhat-template/hardhat.config.ts` to configure networks, compilers, and plugins.

### Next.js Configuration

Edit `secretquiz-frontend/next.config.ts` to configure static export settings and other Next.js options.

## 📖 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/toddysulema/zama_SecretQuiz/issues)
- **FHEVM Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Zama Community**: [Zama Discord](https://discord.gg/zama)

## 🙏 Acknowledgments

- Built with [FHEVM](https://github.com/zama-ai/fhevm) by [Zama](https://www.zama.ai/)
- Uses [Hardhat](https://hardhat.org/) for smart contract development
- Frontend built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)

---

**Built with ❤️ using FHEVM for privacy-preserving blockchain applications**

