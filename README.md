# UniSub Contracts

Web3 訂閱管理平台的智能合約實現

## 🎯 專案概述

這是一個基於 NFT 的去中心化訂閱系統，允許服務提供商創建自己的訂閱 NFT 集合，用戶可以通過購買 NFT 來獲得對應服務的訂閱權限。

## 🏗️ 架構設計

- **SubscriptionFactory.sol**: 工廠合約，用於創建訂閱 NFT 集合
- **SubscriptionNFT.sol**: 訂閱 NFT 合約，實現基於時間的訂閱機制
- **IERC20**: 使用 USDT 作為支付代幣

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 編譯合約
```bash
npx hardhat compile
```

### 運行測試
```bash
npx hardhat test
```

### 部署到本地網絡
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## 📁 專案結構

```
contracts/
├── SubscriptionFactory.sol    # 工廠合約
├── SubscriptionNFT.sol       # 訂閱 NFT 合約
└── interfaces/               # 接口定義

scripts/
├── deploy.js                 # 部署腳本
└── interact.js              # 交互腳本

test/
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
