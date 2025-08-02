#!/bin/bash

# UniSub 快速設置腳本
# 這個腳本會幫助您快速設置測試環境

set -e

echo "🚀 UniSub 合約快速設置"
echo "======================="

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js"
    exit 1
fi

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝，請先安裝 npm"
    exit 1
fi

echo "✅ Node.js 和 npm 已安裝"

# 安裝依賴
echo "📦 安裝專案依賴..."
npm install

# 編譯合約
echo "🔨 編譯智能合約..."
npm run compile

# 運行測試
echo "🧪 運行測試套件..."
npm test

echo ""
echo "🎉 設置完成！"
echo ""
echo "📖 下一步選項："
echo ""
echo "1️⃣  本地測試:"
echo "   npm run node     # 啟動本地區塊鏈 (新終端)"
echo "   npm run deploy:local  # 部署合約"
echo "   npm run web      # 啟動測試網頁"
echo ""
echo "2️⃣  測試網部署:"
echo "   cp .env.example .env  # 複製環境變數範本"
echo "   # 編輯 .env 文件，填入您的私鑰和 API Key"
echo "   npm run deploy:sepolia  # 部署到 Sepolia 測試網"
echo ""
echo "3️⃣  網頁測試界面:"
echo "   npm run web  # 啟動後訪問 http://localhost:8080"
echo ""
echo "📚 更多資訊請查看："
echo "   - README.md (專案概述)"
echo "   - TESTNET_GUIDE.md (測試網部署指南)"
echo ""
echo "🎯 準備好開始您的 Web3 訂閱之旅了嗎？"
