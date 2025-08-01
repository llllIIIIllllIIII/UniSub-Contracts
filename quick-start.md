# UniSub 合約專案快速上手

## 🚀 立即開始

### 專案狀態
- ✅ **已完成**: Hardhat 環境配置、GitHub 倉庫創建、依賴安裝
- 🔄 **進行中**: 智能合約實現
- ⏳ **待辦**: 測試編寫、部署腳本、前端整合

### 一分鐘了解專案
這是一個 **NFT 訂閱系統**：
- 服務商創建訂閱集合 → 用戶購買訂閱 NFT → 獲得服務訪問權限
- 使用 USDT 支付，基於時間的自動到期機制
- 為區塊鏈黑客松開發，重點是創新和展示

---

## 📂 關鍵文檔位置

| 文檔 | 內容 | 用途 |
|------|------|------|
| `project-context.md` | 完整專案記憶和背景 | 新 AI 對話的上下文 |
| `development-guide.md` | 技術實現和代碼示例 | 開發階段參考 |
| `smart-contract-spec.md` | 原始合約規格需求 | 功能設計依據 |
| `quick-start.md` | 本文件，快速導覽 | 專案概覽 |

---

## 🎯 下一步開發計劃

### 優先級排序
1. **實現 SubscriptionNFT.sol** (核心合約)
2. **實現 SubscriptionFactory.sol** (工廠合約)  
3. **編寫基礎測試** (確保功能正確)
4. **本地部署測試** (整合驗證)
5. **測試網部署** (準備展示)

### 關鍵決策待確認
- [ ] NFT 到期後的處理方式 (銷毀 vs 保留)
- [ ] 是否支持 NFT 轉售功能
- [ ] 續費機制的實現方式
- [ ] 動態定價是否允許

---

## 🔗 相關資源

### GitHub 倉庫
- **智能合約**: https://github.com/llllIIIIllllIIII/UniSub-Contracts
- **前端參考**: https://github.com/llllIIIIllllIIII/UniSub

### 技術棧
- **Framework**: Hardhat 2.26.1
- **Solidity**: 0.8.19
- **Libraries**: OpenZeppelin
- **Testing**: Waffle + Chai
- **Payment**: USDT (ERC-20)

### 開發命令速查
```bash
# 安裝依賴 (已完成)
npm install

# 編譯合約
npx hardhat compile

# 運行測試  
npx hardhat test

# 本地區塊鏈
npx hardhat node

# 部署到本地
npx hardhat run scripts/deploy.js --network localhost
```

---

## 💡 給新 AI 對話的提示

當你開始新的對話時，請告訴 AI：

> "我正在開發 UniSub 智能合約專案，這是一個 NFT 訂閱系統。請先閱讀 project-context.md 了解完整背景，然後查看 development-guide.md 了解技術細節。我現在需要 [具體需求]。"

這樣 AI 就能立即理解專案的完整背景，無需重新解釋。

---

## 🏆 黑客松展示重點

### 技術亮點
- 創新的 NFT 訂閱模式
- 去中心化訂閱管理
- 跨平台服務整合
- 時間自動驗證機制

### Demo 流程
1. 部署工廠合約
2. 創建服務訂閱集合 (Netflix, Spotify 等)
3. 用戶購買訂閱 NFT
4. 驗證訂閱狀態
5. 展示到期和續費

### 競爭優勢
- 降低訂閱管理成本
- 提高透明度和信任
- 創造新商業模式
- 支持訂閱資產化

---

*準備好開始編碼了嗎？從 SubscriptionNFT.sol 開始！* 🚀
