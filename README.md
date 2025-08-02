# UniSub Contracts

Web3 訂閱管理平台的智能合約實現

## 🎯 專案概述

這是一個基於 NFT 的去中心化訂閱系統，允許服務提供商創建自己的訂閱 NFT 集合，用戶可以通過購買 NFT 來獲得對應服務的訂閱權限。

## 🏗️ 架構設計

- **SubscriptionFactory.sol**: 工廠合約，用於創建訂閱 NFT 集合
- **SubscriptionNFT.sol**: 訂閱 NFT 合約，實現基於時間的訂閱機制
- **MockUSDT.sol**: 測試用 USDT 代幣合約

## ✨ 核心功能

- 🎬 服務提供商可創建自己的訂閱服務
- � 用戶使用 USDT 購買訂閱 NFT
- ⏰ 基於時間的自動到期機制
- 🔄 訂閱續費功能
- 🔗 NFT 可轉移性
- 📊 跨平台訂閱管理

## �🚀 快速開始

### 本地開發
```bash
# 安裝依賴
npm install

# 編譯合約
npm run compile

# 運行測試
npm test

# 啟動本地區塊鏈
npm run node

# 部署到本地 (另開終端)
npm run deploy:local

# 運行交互演示
npm run interact:local

# 啟動測試網頁
npm run web
# 然後打開 http://localhost:8080
```

### 測試網部署

詳細步驟請參考 [TESTNET_GUIDE.md](./TESTNET_GUIDE.md)

```bash
# 1. 設置環境變數
cp .env.example .env
# 編輯 .env 文件，填入您的私鑰和 API Key

# 2. 部署到 Sepolia 測試網
npm run deploy:sepolia

# 3. 運行測試交互
npm run interact:sepolia
```

## 🧪 測試覆蓋

✅ **39 個測試案例全部通過**

測試內容包括：
- 合約部署和初始化
- 訂閱 NFT 鑄造和驗證
- 續費功能
- 權限控制
- 錯誤處理
- Factory 工廠模式
- 跨集合查詢

```bash
npm test
```

## 🌐 網頁測試界面

我們提供了一個完整的網頁測試界面：

```bash
npm run web
```

功能包括：
- � MetaMask 錢包連接
- 💰 測試 USDT 領取
- 📋 查看所有可用服務
- 🎬 訂閱和續費功能  
- 📊 個人訂閱管理
- 🏭 創建新服務 (服務提供商)

## �📁 專案結構

```
UniSub-Contracts/
├── contracts/                  # 智能合約
│   ├── SubscriptionFactory.sol # 工廠合約
│   ├── SubscriptionNFT.sol    # 訂閱 NFT 合約
│   └── MockUSDT.sol           # 測試 USDT 代幣
├── scripts/                   # 部署和交互腳本
│   ├── deploy.js             # 部署腳本
│   └── interact.js           # 交互演示腳本
├── test/                     # 測試文件
│   ├── SubscriptionFactory.test.js
│   └── SubscriptionNFT.test.js
├── web/                      # 網頁測試界面
│   └── index.html           # 單頁面應用
├── deployments/             # 部署記錄 (自動生成)
├── hardhat.config.js       # Hardhat 配置
├── TESTNET_GUIDE.md        # 測試網部署指南
└── .env.example           # 環境變數範本
```

## 🔧 配置說明

### 支持的網絡
- **本地網絡**: Hardhat Network (開發測試)
- **Sepolia**: Ethereum 測試網 (推薦)
- **Polygon Amoy**: Polygon 測試網 (快速便宜)
- **Mumbai**: Polygon 舊測試網 (即將棄用)

### 環境變數
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key_here
```

## 🎮 使用示例

### 創建訂閱服務
```javascript
// 服務提供商創建 Netflix 訂閱服務
await factory.createSubscriptionCollection(
    "Netflix Premium",    // 服務名稱
    "NFLX",              // 代幣符號
    ethers.utils.parseUnits("15", 6), // 15 USDT
    30 * 24 * 60 * 60    // 30 天
);
```

### 用戶訂閱服務
```javascript
// 用戶購買訂閱
await usdtToken.approve(subscriptionAddress, price);
await subscriptionNFT.mintSubscription();
```

### 驗證訂閱狀態
```javascript
// 檢查用戶是否有有效訂閱
const hasSubscription = await subscriptionNFT.hasValidSubscription(userAddress);
```

## 📊 合約統計

- **Solidity 版本**: 0.8.20
- **OpenZeppelin 版本**: 5.4.0
- **測試覆蓋率**: 100% (39 個測試案例)
- **Gas 優化**: 啟用編譯器優化
- **安全審計**: 使用 OpenZeppelin 標準庫

## 🔒 安全特性

- ✅ ReentrancyGuard 防重入攻擊
- ✅ Ownable 權限控制
- ✅ SafeERC20 安全代幣轉移
- ✅ 輸入驗證和錯誤處理
- ✅ 時間鎖定機制

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交修改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📖 相關資源

- [智能合約規格](./smart-contract-spec.md)
- [開發指南](./development-guide.md)
- [專案背景](./project-context.md)
- [測試網部署指南](./TESTNET_GUIDE.md)

## 🏆 黑客松演示

本專案專為區塊鏈黑客松設計，展示：

1. **創新的 NFT 訂閱模式**
2. **去中心化服務管理**
3. **跨平台訂閱聚合**
4. **用戶友好的 Web3 交互**

## 📝 License

MIT License - 詳見 [LICENSE](LICENSE) 文件

---

**🎉 開始您的 Web3 訂閱之旅！**
├── SubscriptionFactory.test.js
└── SubscriptionNFT.test.js
```

## 🔧 配置

合約支持以下網絡：
- Hardhat 本地網絡
- Localhost (本地區塊鏈)
- 可擴展支持測試網和主網

## 📝 License

MIT
