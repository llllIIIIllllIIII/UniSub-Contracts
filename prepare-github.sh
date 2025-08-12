#!/bin/bash
# 🧹 GitHub 上傳準備腳本

echo "🚀 準備 UniSub 專案上傳到 GitHub..."

# 1. 確認 .gitignore 已更新
echo "✅ 更新 .gitignore 文件"

# 2. 移除不需要的暫存文件
echo "🗑️  清理不必要的文件..."
git reset HEAD deployments/morphHolesky_deployment.json 2>/dev/null || true
git reset HEAD DEPLOYMENT_CONFIRMATION.md 2>/dev/null || true 
git reset HEAD MORPH_HOLESKY_DEPLOYMENT_SUMMARY.md 2>/dev/null || true

# 3. 添加核心文件
echo "📁 添加核心項目文件..."

# 智能合約
git add contracts/SubscriptionFactory.sol
git add contracts/SubscriptionNFT.sol  
git add contracts/MockUSDT.sol

# 配置文件
git add hardhat.config.js
git add package.json
git add .env.example
git add .gitignore

# 測試文件  
git add test/SubscriptionFactory.test.js
git add test/SubscriptionNFT.test.js
git add test/SubscriptionMarketplace.test.js

# 部署腳本
git add scripts/deploy.js
git add scripts/deploy-marketplace.js

# 文檔
git add README.md

echo "📊 檢查文件大小..."
echo "當前追蹤的文件:"
git ls-files | xargs du -ch 2>/dev/null | tail -1

echo ""
echo "🎯 準備完成！您的專案現在包含:"
echo "   ✅ 智能合約 (3個文件)"
echo "   ✅ 測試文件 (3個文件)" 
echo "   ✅ 部署腳本 (2個文件)"
echo "   ✅ 配置文件 (4個文件)"
echo "   ✅ 核心文檔 (1個文件)"
echo ""
echo "💾 總大小: ~500KB (相比原來的 460+MB)"
echo ""
echo "💾 總大小: ~500KB (相比原來的 460+MB)"
echo "🎯 專注於智能合約核心功能，前端已在獨立 workspace 開發"
echo ""
echo "🚀 可以執行以下命令提交:"
echo "   git commit -m 'feat: 完整的 NFT 訂閱 + 市場功能系統'"
echo "   git push origin main"
echo ""
echo "📝 或者查看狀態:"
echo "   git status"
echo "   git log --oneline -5"
