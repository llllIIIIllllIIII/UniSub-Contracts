# UniSub 智能合約專案記憶文檔

## 🎯 專案概述

### 基本信息
- **專案名稱**: UniSub (Universal Subscription)
- **類型**: Web3 去中心化訂閱管理平台
- **目標**: 參加區塊鏈黑客松競賽
- **核心概念**: 基於 NFT 的訂閱憑證系統

### 專案架構決策
- **前端專案**: UniSub (React + Vite) - https://github.com/llllIIIIllllIIII/UniSub
- **合約專案**: UniSub-Contracts (Hardhat) - https://github.com/llllIIIIllllIIII/UniSub-Contracts
- **分離原因**: 團隊協作需求，隊友可能使用不同的前端框架

---

## 🏗️ 技術棧和工具

### 智能合約開發
- **框架**: Hardhat 2.26.1
- **Solidity 版本**: 0.8.19
- **測試框架**: Waffle + Chai
- **安全庫**: OpenZeppelin Contracts
- **支付代幣**: USDT (ERC-20)

### 開發環境
- **Node.js**: 支援 ES modules
- **包管理器**: npm
- **版本控制**: Git + GitHub
- **網絡支援**: Hardhat Network, Localhost, 可擴展測試網

### 已安裝的依賴
```json
{
  "devDependencies": {
    "hardhat": "^2.26.1",
    "@nomiclabs/hardhat-ethers": "latest",
    "@nomiclabs/hardhat-waffle": "latest", 
    "ethers": "latest",
    "@openzeppelin/contracts": "latest",
    "ethereum-waffle": "latest",
    "chai": "latest"
  }
}
```

---

## 📋 智能合約規格詳細說明

### 系統架構
```
SubscriptionFactory (工廠合約)
    ↓ creates
SubscriptionNFT (訂閱 NFT 合約) 
    ↓ uses
USDT (ERC-20 支付代幣)
```

### 核心功能需求

#### 1. SubscriptionFactory 合約
**職責**: 允許服務提供商部署自己的訂閱 NFT 集合

**關鍵函數**:
- `createSubscriptionCollection(string name, uint256 priceInUSDT, uint256 durationInSeconds)`
- `getCollectionsByOwner(address)`
- `getAllCollections()`

**儲存數據**:
- `name`: 服務名稱 (例如: "SuperVPN Premium")
- `price`: USDT 價格
- `duration`: 訂閱持續時間 (秒)
- `owner`: 服務提供商地址

#### 2. SubscriptionNFT 合約
**職責**: 實現基於時間的訂閱 NFT

**關鍵函數**:
- `mintSubscription(address collection)` - 用戶購買訂閱
- `hasValidSubscription(address user)` - 驗證有效訂閱
- `getExpiryTime(uint256 tokenId)` - 查詢到期時間
- `tokenURI(uint256 tokenId)` - 動態元數據 (可選)

**訂閱機制**:
- 用戶支付 USDT → 鑄造 NFT
- NFT 記錄: 擁有者、鑄造時間、到期時間
- 到期計算: `block.timestamp + duration`

#### 3. 可選功能擴展
- NFT 到期後自動銷毀
- 到期前可轉售 NFT
- 續費功能 `renewSubscription(uint256 tokenId)`
- 基於 `block.timestamp` 的動態元數據
- 服務訪問白名單驗證

---

## 🔒 安全要求和最佳實踐

### 必須使用的 OpenZeppelin 組件
- **ERC721**: NFT 標準實現
- **Ownable**: 所有權控制
- **ReentrancyGuard**: 重入攻擊防護
- **SafeERC20**: 安全的 ERC20 代幣交互

### 安全限制
- 服務提供商部署後不能操作訂閱持續時間
- 只有付費用戶才能鑄造訂閱 NFT
- 只有服務提供商可以部署自己的集合
- 必須檢查 USDT 授權額度

### 編碼標準
- 使用最新的 Solidity 0.8.19
- 啟用編譯器優化 (runs: 200)
- 遵循 OpenZeppelin 安全模式

---

## 🤔 待決定的設計問題

### 關鍵決策點
1. **NFT 到期處理**: 自動銷毀 vs 忽略
2. **NFT 交易性**: 是否允許轉售
3. **元數據策略**: 統一 vs 個別定製
4. **續費機制**: 自動 vs 手動
5. **價格更新**: 是否允許服務商調整價格

### 建議的解決方案優先級
1. **高優先級**: 基本的鑄造、驗證、工廠功能
2. **中優先級**: NFT 轉售、續費功能
3. **低優先級**: 動態元數據、高級驗證

---

## 📁 當前專案結構

```
UniSub-Contracts/
├── contracts/                  # 智能合約 (待實現)
│   ├── SubscriptionFactory.sol
│   ├── SubscriptionNFT.sol
│   └── interfaces/
├── scripts/                    # 部署腳本 (待實現)
│   ├── deploy.js
│   └── interact.js
├── test/                      # 測試文件 (待實現)
│   ├── SubscriptionFactory.test.js
│   └── SubscriptionNFT.test.js
├── hardhat.config.js          # ✅ 已配置
├── package.json               # ✅ 已配置
├── smart-contract-spec.md     # ✅ 完整規格
├── README.md                  # ✅ 專案說明
└── .gitignore                 # ✅ 已配置
```

---

## 🎮 開發流程建議

### 第一階段: 核心合約實現
1. 實現 `SubscriptionNFT.sol` 基礎功能
2. 實現 `SubscriptionFactory.sol` 工廠模式
3. 編寫基礎單元測試
4. 本地部署和測試

### 第二階段: 功能完善
1. 添加安全檢查和錯誤處理
2. 實現可選功能 (續費、轉售等)
3. 完善測試覆蓋率
4. 添加事件和日誌

### 第三階段: 部署準備
1. 測試網部署 (Sepolia/Goerli)
2. 合約驗證和開源
3. 文檔完善
4. 前端整合準備

---

## 🔄 與前端專案的整合點

### 合約 ABI 導出
- 編譯後將 ABI 檔案提供給前端團隊
- 部署後提供合約地址
- 提供 TypeScript 類型定義 (可選)

### Web3 整合需求
- 錢包連接 (MetaMask 等)
- USDT 授權和支付流程
- 訂閱狀態查詢
- 交易狀態追蹤

### 前端現有架構 (參考)
- React 18 + Vite
- TailwindCSS v4 設計系統
- 已實現的 UI 組件: SubscriptionCard, TotalCostPanel 等
- 部署地址: https://uni-gkt4433hu-henrys-projects-3b6cc84d.vercel.app

---

## 🏆 黑客松展示重點

### 技術創新點
1. **NFT 訂閱模式**: 將訂閱憑證代幣化
2. **去中心化管理**: 無需中心化服務商控制
3. **可轉售訂閱**: NFT 的金融屬性
4. **時間自動驗證**: 智能合約自動處理到期

### Demo 場景設計
1. 服務商創建訂閱集合 (Netflix, Spotify 等)
2. 用戶購買訂閱 NFT
3. 服務驗證用戶訂閱狀態
4. NFT 到期和續費演示

### 競爭優勢
- 降低訂閱管理成本
- 提高訂閱透明度
- 創造新的商業模式
- 跨平台訂閱聚合

---

## 📞 團隊協作資訊

### GitHub 倉庫
- **合約**: https://github.com/llllIIIIllllIIII/UniSub-Contracts
- **前端**: https://github.com/llllIIIIllllIIII/UniSub

### 分工建議
- **合約開發**: 專注於 Solidity 實現和測試
- **前端開發**: 隊友負責 Web3 整合和 UI
- **產品展示**: 合作準備 Demo 和技術文檔

### 關鍵里程碑
- [ ] 合約基礎實現
- [ ] 本地測試通過  
- [ ] 測試網部署
- [ ] 前端整合
- [ ] 黑客松展示準備

---

*最後更新: 2025年8月1日*
*用途: 為新的 AI 對話提供完整的專案上下文*
