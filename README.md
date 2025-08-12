# UniSub Contracts

NFT-based decentralized subscription system with integrated marketplace functionality.

## 🚀 Overview

UniSub is a Web3 subscription platform that enables service providers to create their own subscription NFT collections. Users can purchase subscription NFTs with USDT to access services, and trade them on the integrated marketplace.

**✨ Key Features:**
- 🏭 **Factory Pattern**: Create multiple subscription services
- 💳 **USDT Payments**: Stable pricing with ERC-20 tokens  
- ⏰ **Time-based Subscriptions**: Automatic expiration system
- 🔄 **Renewal System**: Easy subscription extensions
- 🛒 **Integrated Marketplace**: Zero-fee NFT trading
- 🔗 **Transferable NFTs**: Full ownership rights

## 🏗️ Architecture

- **SubscriptionFactory.sol**: Factory contract with marketplace functionality
- **SubscriptionNFT.sol**: Time-based subscription NFT implementation
- **MockUSDT.sol**: Test USDT token for development

## 🧪 Testing

**51 Tests Passing** ✅ (39 core + 12 marketplace tests)

```bash
npm install
npm test
```

## 🌐 Supported Networks

- **Sepolia** (Ethereum Testnet)
- **Polygon Amoy** (Polygon Testnet) 
- **Morph Holesky** (Morph Testnet)
- **Local Development** (Hardhat Network)

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npm test

# Deploy locally
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy-marketplace.js --network localhost
```

### Testnet Deployment

```bash
# Setup environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY and RPC URLs

# Deploy to Sepolia
npx hardhat run scripts/deploy-marketplace.js --network sepolia
```

## 📊 Contract Statistics

- **Solidity**: 0.8.20
- **OpenZeppelin**: v5.x
- **Gas Optimized**: Compiler optimizations enabled
- **Test Coverage**: 100% (51 test cases)

## 🔒 Security Features

- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **Ownable**: Access control mechanisms  
- ✅ **SafeERC20**: Safe token transfers
- ✅ **Input Validation**: Comprehensive error handling

## 💼 Usage Examples

### Create Subscription Service
```solidity
factory.createSubscriptionCollection(
    "Netflix Premium",           // Service name
    "NFLX",                     // Token symbol  
    15000000,                   // 15 USDT (6 decimals)
    2592000                     // 30 days in seconds
);
```

### Purchase Subscription
```solidity
usdtToken.approve(subscriptionAddress, price);
subscriptionNFT.mintSubscription();
```

### Marketplace Operations
```solidity
// List subscription for sale
subscriptionNFT.approve(factoryAddress, tokenId);
factory.listSubscription(subscriptionAddress, tokenId, price);

// Buy from marketplace  
usdtToken.approve(factoryAddress, price);
factory.buySubscription(subscriptionAddress, tokenId);
```

## 🛠️ Development

```bash
# Local blockchain
npx hardhat node

# Deploy with marketplace
npx hardhat run scripts/deploy-marketplace.js --network localhost

# Interactive testing
npx hardhat run scripts/interact.js --network localhost
```

## 📁 Project Structure

```
contracts/
├── SubscriptionFactory.sol    # Factory + Marketplace
├── SubscriptionNFT.sol       # Subscription NFTs
└── MockUSDT.sol             # Test token

scripts/
├── deploy-marketplace.js     # Main deployment script
└── interact.js              # Demo interactions

test/
├── SubscriptionFactory.test.js
├── SubscriptionNFT.test.js
└── SubscriptionMarketplace.test.js
```

## 🏆 Hackathon Ready

Perfect for blockchain hackathons showcasing:
- ✅ **DeFi + NFT Integration**
- ✅ **Real-world Use Case**
- ✅ **Complete Test Coverage**  
- ✅ **Multi-network Support**
- ✅ **Zero-fee Marketplace**

## 📝 License

MIT License
