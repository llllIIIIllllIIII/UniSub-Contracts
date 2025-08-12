# UniSub Smart Contract System - AI Agent Guide

**本文件專為前端 AI Agent 提供完整的智能合約系統理解和集成指南**

## 🎯 系統概述

UniSub 是一個基於 NFT 的去中心化訂閱系統，包含**工廠模式**和**內建市場**功能。用戶可以創建訂閱服務、購買訂閱 NFT、並在市場上交易。

### 核心架構
```
SubscriptionFactory (工廠 + 市場)
├── 創建訂閱服務集合
├── NFT 市場功能 (零手續費)
└── 支付使用 USDT

SubscriptionNFT (訂閱 NFT)
├── 基於時間的訂閱機制
├── 自動過期系統
└── 可轉移的 NFT

MockUSDT (測試代幣)
└── 穩定幣支付系統
```

## 🌐 Morph Holesky 部署信息

### 合約地址
- **Mock USDT**: `0xA2c5e6a98dc69CD3e7c94d3694B7D31DB5FFE33F`
- **SubscriptionFactory**: `0x657296a72483F8F330287B2F1E20293a2a2C2F52`

### 網絡配置
- **鏈 ID**: 2810
- **RPC URL**: `https://rpc-quicknode-holesky.morphl2.io`
- **區塊鏈瀏覽器**: `https://explorer-holesky.morphl2.io`

### 預建的訂閱服務
1. **Netflix Premium**
   - 地址: `0x2FCc622C00bBD6961e08C974167a233cd9FFC283`
   - 符號: NFLX
   - 價格: 15 USDT
   - 期限: 30 天

2. **Spotify Premium**
   - 地址: `0x1c9fFB664d59F60d157e5885C2EdFB287B913091`
   - 符號: SPOT
   - 價格: 10 USDT
   - 期限: 30 天

## 🔧 智能合約接口詳解

### 1. SubscriptionFactory 主要功能

#### 創建訂閱服務 (服務提供商)
```javascript
// 創建新的訂閱服務集合
await factory.createSubscriptionCollection(
    "Service Name",        // 服務名稱
    "SYMBOL",             // 代幣符號
    priceInUSDT,          // 價格 (6位小數, 如 15000000 = 15 USDT)
    durationInSeconds     // 訂閱期限 (秒)
);

// 獲取服務提供商創建的所有集合
const collections = await factory.getCollectionsByOwner(providerAddress);
```

#### 市場功能 (零手續費交易)
```javascript
// 掛單出售 NFT
await subscriptionNFT.approve(factoryAddress, tokenId);
await factory.listSubscription(collectionAddress, tokenId, priceInUSDT);

// 購買市場上的 NFT (使用 listingId)
await usdtToken.approve(factoryAddress, priceInUSDT);
await factory.buySubscription(listingId);

// 取消掛單 (使用 listingId)
await factory.cancelListing(listingId);

// 查看市場掛單
const listings = await factory.getMarketListings();
```

### 2. SubscriptionNFT 訂閱管理

#### 訂閱相關操作
```javascript
// 購買新訂閱
await usdtToken.approve(subscriptionAddress, price);
await subscriptionNFT.mintSubscription();

// 續費現有訂閱
await usdtToken.approve(subscriptionAddress, price);
await subscriptionNFT.renewSubscription(tokenId);

// 檢查訂閱有效性
const isValid = await subscriptionNFT.hasValidSubscription(userAddress);
const expirationTime = await subscriptionNFT.getExpiryTime(tokenId);

// 查詢用戶的所有訂閱
const userTokens = await subscriptionNFT.getUserTokens(userAddress);
```

### 3. USDT 代幣操作
```javascript
// 查詢餘額
const balance = await usdtToken.balanceOf(userAddress);

// 授權額度
await usdtToken.approve(spenderAddress, amount);

// 查詢授權額度
const allowance = await usdtToken.allowance(ownerAddress, spenderAddress);

// 轉帳 (測試用)
await usdtToken.transfer(toAddress, amount);
```

## 🎮 常見使用場景

### 場景 1: 用戶購買訂閱
```javascript
// 1. 檢查 USDT 餘額
const balance = await usdtToken.balanceOf(userAddress);
if (balance.lt(price)) {
    throw new Error("USDT 餘額不足");
}

// 2. 授權支付
await usdtToken.approve(subscriptionAddress, price);

// 3. 購買訂閱 NFT
const tx = await subscriptionNFT.mintSubscription();
await tx.wait();

// 4. 驗證購買成功
const hasSubscription = await subscriptionNFT.hasValidSubscription(userAddress);
```

### 場景 2: 在市場出售 NFT
```javascript
// 1. 檢查用戶擁有的 NFT
const userTokens = await subscriptionNFT.getUserTokens(userAddress);
const tokenId = userTokens[0]; // 選擇第一個

// 2. 授權工廠合約轉移 NFT
await subscriptionNFT.approve(factoryAddress, tokenId);

// 3. 掛單出售
const sellPrice = ethers.utils.parseUnits("12", 6); // 12 USDT
const listingId = await factory.listSubscription(subscriptionAddress, tokenId, sellPrice);
```

### 場景 3: 從市場購買 NFT
```javascript
// 1. 查看市場掛單
const listings = await factory.getMarketListings();
const listing = listings[0]; // 選擇第一個掛單

// 2. 授權支付
await usdtToken.approve(factoryAddress, listing.price);

// 3. 購買
await factory.buySubscription(listing.listingId);
```

## 📊 數據查詢接口

### 獲取系統狀態
```javascript
// 所有訂閱服務集合
const allCollections = await factory.getAllCollections();

// 特定服務商的集合
const providerCollections = await factory.getCollectionsByOwner(providerAddress);

// 市場掛單列表
const marketListings = await factory.getMarketListings();
```

### 合約詳細信息
```javascript
// 訂閱服務信息
const serviceName = await subscriptionNFT.name();
const symbol = await subscriptionNFT.symbol();
const price = await subscriptionNFT.price();
const duration = await subscriptionNFT.duration();
const usdtToken = await subscriptionNFT.usdtToken();

// 或者使用便利函數獲取完整信息
const [serviceName2, price2, duration2, totalSupply] = await subscriptionNFT.getContractInfo();

// NFT 詳細信息
const tokenURI = await subscriptionNFT.tokenURI(tokenId);
const owner = await subscriptionNFT.ownerOf(tokenId);
const expiration = await subscriptionNFT.getExpiryTime(tokenId);
```

## ⚠️ 重要注意事項

### 授權機制
- **所有支付操作都需要先授權 USDT**
- **NFT 轉移需要先授權目標合約**
- 授權額度建議設為確切金額以提高安全性

### 錯誤處理
```javascript
try {
    await subscriptionNFT.mintSubscription();
} catch (error) {
    if (error.message.includes("Insufficient USDT allowance")) {
        // 需要授權更多 USDT
    } else if (error.message.includes("User already has active subscription")) {
        // 用戶已有有效訂閱
    } else if (error.message.includes("cannot estimate gas")) {
        // Gas 估算失敗，嘗試手動設置 gasLimit
        const gasLimit = 500000; // 手動設定 gas limit
        await subscriptionNFT.mintSubscription({ gasLimit });
    }
}
```

### Gas 估算問題解決方案
```javascript
// 方法 1: 手動設定 gasLimit
const tx = await subscriptionNFT.mintSubscription({
    gasLimit: 500000
});

// 方法 2: 先檢查條件再執行交易
const balance = await usdtToken.balanceOf(userAddress);
const allowance = await usdtToken.allowance(userAddress, subscriptionAddress);
const hasSubscription = await subscriptionNFT.hasValidSubscription(userAddress);

if (balance.lt(price)) {
    throw new Error("USDT 餘額不足");
}
if (allowance.lt(price)) {
    throw new Error("需要授權 USDT");
}
if (hasSubscription) {
    throw new Error("已有有效訂閱");
}

// 條件都滿足後再執行交易
await subscriptionNFT.mintSubscription();
```

### Gas 估算
```javascript
// 估算 gas 費用
const gasEstimate = await subscriptionNFT.estimateGas.mintSubscription();
const gasPrice = await provider.getGasPrice();
const gasCost = gasEstimate.mul(gasPrice);
```

## 🧪 測試輔助

### 獲取測試 USDT (僅限測試網)
```javascript
// 從 MockUSDT 合約獲取測試代幣
await usdtToken.mint(userAddress, ethers.utils.parseUnits("1000", 6));
```

### 合約驗證
```javascript
// 驗證合約是否正確部署
const factoryCode = await provider.getCode(factoryAddress);
if (factoryCode === "0x") {
    throw new Error("工廠合約未部署");
}
```

## 🔗 前端整合建議

### Web3 連接
```javascript
// 推薦使用 ethers.js v5
import { ethers } from 'ethers';

// 連接到 Morph Holesky
const provider = new ethers.providers.JsonRpcProvider(
    'https://rpc-quicknode-holesky.morphl2.io'
);

// 連接錢包
const signer = provider.getSigner();
```

### 合約實例化
```javascript
// 載入合約 ABI (需要從編譯後的 artifacts 獲取)
const factoryContract = new ethers.Contract(
    "0x657296a72483F8F330287B2F1E20293a2a2C2F52",
    FACTORY_ABI,
    signer
);
```

---

**此文件包含了前端 AI Agent 所需的完整合約理解和集成信息。請根據實際需求選擇合適的功能進行集成。**
