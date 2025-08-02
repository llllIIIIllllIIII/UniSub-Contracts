# 🚀 UniSub 測試網部署指南

## 📋 準備工作

### 1. 獲取必要的 API Key 和資源

#### 🔑 Infura API Key (推薦)
1. 前往 [https://infura.io/](https://infura.io/)
2. 註冊並創建新專案
3. 複製 Project ID (這就是您的 API Key)

#### 🔑 或者使用 Alchemy (替代選項)
1. 前往 [https://alchemy.com/](https://alchemy.com/)
2. 註冊並創建新 App
3. 複製 API Key

#### 💰 獲取測試網 ETH
- **Sepolia**: [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
- **Polygon Amoy**: [https://faucet.polygon.technology/](https://faucet.polygon.technology/)

### 2. 設置環境變數

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 文件
nano .env  # 或使用您偏好的編輯器
```

在 `.env` 文件中填入：
```env
# 您的錢包私鑰 (不要包含 0x)
PRIVATE_KEY=your_private_key_here

# Infura API Key
INFURA_API_KEY=your_infura_api_key_here
```

⚠️ **安全提醒**: 
- 只使用測試錢包的私鑰
- 絕對不要提交 `.env` 文件到 git
- 確保錢包中有足夠的測試 ETH

## 🌐 支持的測試網

### 1. Sepolia (推薦 - 最穩定)
- **Chain ID**: 11155111
- **RPC**: `https://sepolia.infura.io/v3/YOUR_API_KEY`
- **Faucet**: [sepoliafaucet.com](https://sepoliafaucet.com/)
- **Explorer**: [sepolia.etherscan.io](https://sepolia.etherscan.io/)

### 2. Polygon Amoy (速度快，費用低)
- **Chain ID**: 80002
- **RPC**: `https://polygon-amoy.infura.io/v3/YOUR_API_KEY`
- **Faucet**: [faucet.polygon.technology](https://faucet.polygon.technology/)
- **Explorer**: [amoy.polygonscan.com](https://amoy.polygonscan.com/)

### 3. Mumbai (即將棄用)
- **Chain ID**: 80001
- **RPC**: `https://polygon-mumbai.infura.io/v3/YOUR_API_KEY`

## 🚀 部署步驟

### 1. 編譯合約
```bash
npm run compile
```

### 2. 部署到 Sepolia
```bash
npm run deploy:sepolia
```

### 3. 部署到 Polygon Amoy
```bash
npm run deploy:amoy
```

### 4. 查看部署結果
部署完成後，查看 `deployments/` 目錄下的 JSON 文件，例如：
- `deployments/sepolia_deployment.json`
- `deployments/amoy_deployment.json`

## 🎮 測試交互

### 1. 命令行交互
```bash
# Sepolia
npm run interact:sepolia

# Amoy
npm run interact:amoy
```

### 2. 網頁界面測試
```bash
# 啟動本地網頁服務器
npm run web

# 或者直接打開 web/index.html
```

然後：
1. 在瀏覽器打開 `http://localhost:8080`
2. 連接 MetaMask 錢包
3. 切換到對應的測試網
4. 輸入部署的合約地址
5. 開始測試！

## 📊 測試功能清單

### ✅ 基本功能測試
- [ ] 連接錢包
- [ ] 領取測試 USDT
- [ ] 查看可用服務
- [ ] 訂閱服務
- [ ] 查看我的訂閱
- [ ] 續費訂閱
- [ ] 創建新服務 (服務提供商)

### ✅ 高級功能測試
- [ ] NFT 轉移
- [ ] 過期訂閱處理
- [ ] 跨平台訂閱查詢
- [ ] 批量操作

## 🔧 常見問題

### Q: MetaMask 連接失敗
A: 確保：
- MetaMask 已安裝並解鎖
- 網絡已切換到正確的測試網
- 錢包中有足夠的測試 ETH

### Q: 交易失敗
A: 檢查：
- Gas 費用是否足夠
- 合約地址是否正確
- USDT 授權是否充足

### Q: 合約驗證
A: 使用 Hardhat 驗證：
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "CONSTRUCTOR_ARG1" "CONSTRUCTOR_ARG2"
```

## 📱 移動端測試

### MetaMask 移動端
1. 安裝 MetaMask 移動應用
2. 在 DApp 瀏覽器中打開測試頁面
3. 連接錢包進行測試

### WalletConnect
可以集成 WalletConnect 支持更多錢包應用。

## 🎯 推薦測試流程

1. **部署階段**:
   ```bash
   # 1. 部署到 Sepolia
   npm run deploy:sepolia
   
   # 2. 記錄合約地址
   cat deployments/sepolia_deployment.json
   ```

2. **基本測試**:
   - 使用網頁界面進行基本功能測試
   - 驗證所有核心功能正常

3. **壓力測試**:
   - 創建多個服務
   - 測試大量用戶訂閱
   - 驗證 Gas 消耗

4. **前端整合**:
   - 將合約地址集成到您的前端應用
   - 測試完整的用戶流程

## 📈 監控和分析

### 區塊鏈瀏覽器
- 監控交易狀態
- 查看合約調用
- 分析 Gas 使用情況

### 事件監聽
合約會發出以下事件：
- `CollectionCreated`: 新服務創建
- `SubscriptionMinted`: 用戶訂閱
- `SubscriptionRenewed`: 訂閱續費

可以使用這些事件構建實時通知和分析系統。

---

**🎉 準備好開始測試了嗎？**

按照以上步驟，您就可以在測試網上完整體驗 UniSub 的所有功能！
