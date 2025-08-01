# UniSub 開發指南和代碼示例

## 🔧 Hardhat 配置詳細說明

### 當前配置 (hardhat.config.js)
```javascript
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache", 
    artifacts: "./artifacts"
  }
};
```

### 可擴展的網絡配置
```javascript
// 添加到 networks 部分
sepolia: {
  url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
  accounts: [`0x${process.env.PRIVATE_KEY}`]
},
polygon: {
  url: "https://polygon-rpc.com/",
  accounts: [`0x${process.env.PRIVATE_KEY}`]
}
```

---

## 📝 合約設計模式和最佳實踐

### 基礎合約結構模板

#### SubscriptionNFT.sol 框架
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SubscriptionNFT is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // 核心狀態變量
    IERC20 public immutable usdtToken;
    uint256 public immutable price;
    uint256 public immutable duration;
    uint256 private _tokenIdCounter;
    
    // 訂閱數據映射
    mapping(uint256 => uint256) public expiryTimes;
    mapping(address => uint256[]) public userTokens;
    
    // 事件定義
    event SubscriptionMinted(address indexed user, uint256 tokenId, uint256 expiryTime);
    event SubscriptionRenewed(uint256 tokenId, uint256 newExpiryTime);
    
    constructor(
        string memory name,
        string memory symbol,
        address _usdtToken,
        uint256 _price,
        uint256 _duration
    ) ERC721(name, symbol) {
        usdtToken = IERC20(_usdtToken);
        price = _price;
        duration = _duration;
    }
    
    // 核心功能實現...
}
```

#### SubscriptionFactory.sol 框架
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SubscriptionNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SubscriptionFactory is Ownable {
    // 集合註冊
    address[] public allCollections;
    mapping(address => address[]) public collectionsByOwner;
    mapping(address => bool) public isValidCollection;
    
    // 事件
    event CollectionCreated(
        address indexed creator,
        address indexed collection,
        string name,
        uint256 price,
        uint256 duration
    );
    
    function createSubscriptionCollection(
        string memory name,
        string memory symbol,
        address usdtToken,
        uint256 price,
        uint256 duration
    ) external returns (address) {
        // 實現邏輯...
    }
}
```

---

## 🧪 測試策略和示例

### 測試結構建議
```javascript
// test/SubscriptionNFT.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SubscriptionNFT", function () {
  let subscriptionNFT;
  let usdtToken;
  let owner, user1, user2;
  
  beforeEach(async function () {
    // 部署邏輯...
  });
  
  describe("Subscription Minting", function () {
    it("Should mint subscription NFT with correct expiry", async function () {
      // 測試邏輯...
    });
    
    it("Should fail if insufficient USDT allowance", async function () {
      // 測試邏輯...
    });
  });
  
  describe("Subscription Validation", function () {
    it("Should return true for valid subscription", async function () {
      // 測試邏輯...
    });
    
    it("Should return false for expired subscription", async function () {
      // 測試邏輯...
    });
  });
});
```

### 關鍵測試用例
1. **正常流程測試**
   - 成功鑄造訂閱 NFT
   - 正確計算到期時間
   - 有效訂閱驗證

2. **邊界條件測試**
   - 零價格訂閱
   - 極長/極短訂閱期
   - 批量訂閱處理

3. **安全性測試**
   - 重入攻擊防護
   - 權限控制驗證
   - 整數溢出防護

4. **錯誤情況測試**
   - 授權不足
   - 合約暫停
   - 無效參數

---

## 🚀 部署腳本模板

### scripts/deploy.js
```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // 部署 USDT 模擬合約 (測試用)
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdtToken = await MockUSDT.deploy();
  await usdtToken.deployed();
  console.log("Mock USDT deployed to:", usdtToken.address);
  
  // 部署工廠合約
  const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
  const factory = await SubscriptionFactory.deploy();
  await factory.deployed();
  console.log("SubscriptionFactory deployed to:", factory.address);
  
  // 創建示例訂閱集合
  const tx = await factory.createSubscriptionCollection(
    "Netflix Premium",
    "NFLX",
    usdtToken.address,
    ethers.utils.parseUnits("15", 6), // 15 USDT
    30 * 24 * 60 * 60 // 30 天
  );
  
  console.log("Sample collection created in tx:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 🎯 關鍵功能實現提示

### 1. 時間處理機制
```solidity
function hasValidSubscription(address user) external view returns (bool) {
    uint256[] memory tokens = userTokens[user];
    for (uint256 i = 0; i < tokens.length; i++) {
        if (block.timestamp < expiryTimes[tokens[i]]) {
            return true;
        }
    }
    return false;
}
```

### 2. 安全的支付處理
```solidity
function mintSubscription() external nonReentrant {
    require(price > 0, "Price not set");
    
    // 檢查和轉移 USDT
    usdtToken.safeTransferFrom(msg.sender, owner(), price);
    
    // 鑄造 NFT
    uint256 tokenId = _tokenIdCounter++;
    _safeMint(msg.sender, tokenId);
    
    // 設置到期時間
    expiryTimes[tokenId] = block.timestamp + duration;
    userTokens[msg.sender].push(tokenId);
    
    emit SubscriptionMinted(msg.sender, tokenId, expiryTimes[tokenId]);
}
```

### 3. Gas 優化技巧
- 使用 `immutable` 對於部署時設定的變量
- 批量操作減少交易次數
- 事件記錄替代狀態存儲
- 適當的數據結構選擇

---

## 🔍 Debug 和故障排除

### 常見問題解決
1. **編譯錯誤**: 檢查 Solidity 版本和 import 路徑
2. **測試失敗**: 確認 beforeEach 設置和時間處理
3. **部署失敗**: 檢查網絡配置和 gas 設置
4. **授權問題**: 確認 USDT approve 操作

### 有用的調試命令
```bash
# 編譯合約
npx hardhat compile

# 運行測試
npx hardhat test

# 本地網絡
npx hardhat node

# 部署到本地
npx hardhat run scripts/deploy.js --network localhost

# 驗證合約
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Constructor arg 1"
```

---

## 📊 性能和成本優化

### Gas 估算指導
- **創建集合**: ~200,000 gas
- **鑄造訂閱**: ~100,000 gas  
- **驗證訂閱**: ~30,000 gas (view 函數)
- **續費**: ~50,000 gas

### 成本優化策略
1. 使用事件而非存儲來記錄歷史
2. 批量操作減少交易費用
3. 適當的數據打包
4. Layer 2 部署考慮

---

*這份文檔包含了所有技術實現的詳細指導，可以直接用於開發階段的參考。*
