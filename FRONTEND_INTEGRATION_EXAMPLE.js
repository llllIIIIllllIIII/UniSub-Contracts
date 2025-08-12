// UniSub 前端集成示例 - 供 AI Agent 參考
// 此文件展示如何在前端項目中集成 UniSub 智能合約

import { ethers } from 'ethers';

// 從 CONTRACT_CONFIG_FOR_FRONTEND.json 載入配置
const CONTRACT_CONFIG = {
  morphHolesky: {
    chainId: 2810,
    rpcUrl: "https://rpc-quicknode-holesky.morphl2.io",
    contracts: {
      mockUSDT: "0xA2c5e6a98dc69CD3e7c94d3694B7D31DB5FFE33F",
      subscriptionFactory: "0x657296a72483F8F330287B2F1E20293a2a2C2F52"
    },
    services: {
      netflixPremium: "0x2FCc622C00bBD6961e08C974167a233cd9FFC283",
      spotifyPremium: "0x1c9fFB664d59F60d157e5885C2EdFB287B913091"
    }
  }
};

// 合約 ABI (簡化版，實際使用時需要完整 ABI)
const FACTORY_ABI = [
  "function createSubscriptionCollection(string memory _name, string memory _symbol, uint256 _price, uint256 _duration) external returns (address)",
  "function getAllCollections() external view returns (address[])",
  "function getCollectionsByOwner(address owner) external view returns (address[])",
  "function isValidCollection(address collection) external view returns (bool)",
  "function listSubscription(address collection, uint256 tokenId, uint256 price) external returns (bytes32)",
  "function buySubscription(bytes32 listingId) external",
  "function cancelListing(bytes32 listingId) external",
  "function getMarketListings() external view returns (tuple(bytes32 listingId, address seller, address collection, uint256 tokenId, uint256 price, uint256 expiryTime, bool isActive, uint256 listedAt)[])"
];

const SUBSCRIPTION_ABI = [
  "function mintSubscription() external returns (uint256)",
  "function renewSubscription(uint256 _tokenId) external",
  "function hasValidSubscription(address _user) external view returns (bool)",
  "function getExpiryTime(uint256 _tokenId) external view returns (uint256)",
  "function getUserTokens(address _user) external view returns (uint256[])",
  "function price() external view returns (uint256)",
  "function duration() external view returns (uint256)",
  "function name() external view returns (string memory)",
  "function ownerOf(uint256 _tokenId) external view returns (address)",
  "function approve(address _to, uint256 _tokenId) external",
  "function getApproved(uint256 _tokenId) external view returns (address)",
  "function setApprovalForAll(address _operator, bool _approved) external",
  "function isApprovedForAll(address _owner, address _operator) external view returns (bool)",
  "function transferFrom(address _from, address _to, uint256 _tokenId) external",
  "function safeTransferFrom(address _from, address _to, uint256 _tokenId) external",
  "function balanceOf(address _owner) external view returns (uint256)"
];

const USDT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function mint(address to, uint256 amount) external"
];

class UniSubIntegration {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.userAddress = null;
  }

  // 初始化連接
  async initialize() {
    // 連接到 Morph Holesky 測試網
    this.provider = new ethers.providers.JsonRpcProvider(CONTRACT_CONFIG.morphHolesky.rpcUrl);
    
    // 如果有 MetaMask，使用 MetaMask signer
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      this.userAddress = await this.signer.getAddress();
      
      // 切換到 Morph Holesky 網絡
      await this.switchToMorphHolesky();
    }

    // 初始化合約實例
    this.contracts.factory = new ethers.Contract(
      CONTRACT_CONFIG.morphHolesky.contracts.subscriptionFactory,
      FACTORY_ABI,
      this.signer || this.provider
    );

    this.contracts.usdt = new ethers.Contract(
      CONTRACT_CONFIG.morphHolesky.contracts.mockUSDT,
      USDT_ABI,
      this.signer || this.provider
    );

    console.log('UniSub 已初始化，用戶地址:', this.userAddress);
  }

  // 切換到 Morph Holesky 網絡
  async switchToMorphHolesky() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONTRACT_CONFIG.morphHolesky.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // 如果網絡不存在，添加網絡
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${CONTRACT_CONFIG.morphHolesky.chainId.toString(16)}`,
            chainName: 'Morph Holesky Testnet',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [CONTRACT_CONFIG.morphHolesky.rpcUrl],
            blockExplorerUrls: ['https://explorer-holesky.morphl2.io'],
          }],
        });
      }
    }
  }

  // 獲取用戶 USDT 餘額
  async getUSDTBalance(userAddress = this.userAddress) {
    const balance = await this.contracts.usdt.balanceOf(userAddress);
    return ethers.utils.formatUnits(balance, 6); // USDT 有 6 位小數
  }

  // 獲取所有可用的訂閱服務
  async getAllServices() {
    const collections = await this.contracts.factory.getAllCollections();
    const services = [];

    for (const address of collections) {
      const contract = new ethers.Contract(address, SUBSCRIPTION_ABI, this.provider);
      const name = await contract.name();
      const price = await contract.price();
      
      services.push({
        address,
        name,
        price: ethers.utils.formatUnits(price, 6),
        contract
      });
    }

    return services;
  }

  // 購買訂閱 (完整流程)
  async purchaseSubscription(subscriptionAddress) {
    try {
      const subscriptionContract = new ethers.Contract(subscriptionAddress, SUBSCRIPTION_ABI, this.signer);
      const price = await subscriptionContract.price();

      // 1. 檢查餘額
      const balance = await this.contracts.usdt.balanceOf(this.userAddress);
      if (balance.lt(price)) {
        throw new Error(`USDT 餘額不足。需要 ${ethers.utils.formatUnits(price, 6)} USDT`);
      }

      // 2. 授權支付
      console.log('授權 USDT 支付...');
      const approveTx = await this.contracts.usdt.approve(subscriptionAddress, price);
      await approveTx.wait();

      // 3. 購買訂閱
      console.log('購買訂閱 NFT...');
      const mintTx = await subscriptionContract.mintSubscription();
      const receipt = await mintTx.wait();

      console.log('訂閱購買成功！交易哈希:', receipt.transactionHash);
      return receipt;

    } catch (error) {
      console.error('購買訂閱失敗:', error);
      
      // 處理 Gas 估算錯誤
      if (error.message.includes('cannot estimate gas')) {
        console.log('Gas 估算失敗，嘗試手動設置 gasLimit...');
        try {
          // 重試，手動設置 gasLimit
          const tx = await subscriptionContract.mintSubscription({ gasLimit: 500000 });
          const receipt = await tx.wait();
          console.log('使用手動 gasLimit 購買成功！', receipt.transactionHash);
          return receipt;
        } catch (retryError) {
          console.error('手動 gasLimit 重試也失敗:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  // 檢查用戶訂閱狀態
  async checkSubscriptionStatus(subscriptionAddress) {
    const subscriptionContract = new ethers.Contract(subscriptionAddress, SUBSCRIPTION_ABI, this.provider);
    
    const hasSubscription = await subscriptionContract.hasValidSubscription(this.userAddress);
    const userTokens = await subscriptionContract.getUserTokens(this.userAddress);

    if (hasSubscription && userTokens.length > 0) {
      const expiration = await subscriptionContract.getExpiryTime(userTokens[0]);
      return {
        hasActiveSubscription: true,
        tokenId: userTokens[0].toString(),
        expirationTime: new Date(expiration.toNumber() * 1000)
      };
    }

    return { hasActiveSubscription: false };
  }

  // 在市場上列出 NFT 出售
  async listNFTForSale(subscriptionAddress, tokenId, priceInUSDT) {
    try {
      const subscriptionContract = new ethers.Contract(subscriptionAddress, SUBSCRIPTION_ABI, this.signer);
      const price = ethers.utils.parseUnits(priceInUSDT.toString(), 6);

      // 預檢查：確認集合是否有效
      const isValidCollection = await this.contracts.factory.isValidCollection(subscriptionAddress);
      if (!isValidCollection) {
        throw new Error(`合約地址 ${subscriptionAddress} 不是有效的訂閱集合`);
      }

      // 預檢查：確認用戶擁有 NFT
      const owner = await subscriptionContract.ownerOf(tokenId);
      if (owner.toLowerCase() !== this.userAddress.toLowerCase()) {
        throw new Error(`你不是 tokenId ${tokenId} 的擁有者`);
      }

      // 預檢查：確認 NFT 尚未過期
      const expiryTime = await subscriptionContract.getExpiryTime(tokenId);
      if (expiryTime.toNumber() <= Math.floor(Date.now() / 1000)) {
        throw new Error('無法出售已過期的訂閱 NFT');
      }

      // 預檢查：確認價格 > 0
      if (price.isZero()) {
        throw new Error('價格必須大於 0');
      }

      // 1. 授權工廠合約轉移 NFT
      console.log('授權 NFT 轉移...');
      const approveTx = await subscriptionContract.approve(CONTRACT_CONFIG.morphHolesky.contracts.subscriptionFactory, tokenId);
      await approveTx.wait();

      // 2. 掛單出售
      console.log('掛單出售...');
      const listTx = await this.contracts.factory.listSubscription(subscriptionAddress, tokenId, price);
      const receipt = await listTx.wait();

      console.log('NFT 掛單成功！交易哈希:', receipt.transactionHash);
      return receipt;

    } catch (error) {
      console.error('掛單失敗:', error);
      
      // 處理 Gas 估算錯誤
      if (error.message.includes('cannot estimate gas') || error.message.includes('UNPREDICTABLE_GAS_LIMIT')) {
        console.log('Gas 估算失敗，嘗試手動設置 gasLimit...');
        try {
          const subscriptionContract = new ethers.Contract(subscriptionAddress, SUBSCRIPTION_ABI, this.signer);
          const price = ethers.utils.parseUnits(priceInUSDT.toString(), 6);
          
          // 重試，手動設置 gasLimit
          const tx = await this.contracts.factory.listSubscription(subscriptionAddress, tokenId, price, { gasLimit: 500000 });
          const receipt = await tx.wait();
          console.log('使用手動 gasLimit 掛單成功！', receipt.transactionHash);
          return receipt;
        } catch (retryError) {
          console.error('手動 gasLimit 重試也失敗:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  // 從市場購買 NFT
  async buyNFTFromMarket(subscriptionAddress, tokenId) {
    try {
      const listings = await this.contracts.factory.getMarketListings();
      const listing = listings.find(l => 
        l.subscriptionContract === subscriptionAddress && 
        l.tokenId.toString() === tokenId.toString()
      );

      if (!listing) {
        throw new Error('找不到對應的掛單');
      }

      // 1. 授權支付
      console.log('授權 USDT 支付...');
      const approveTx = await this.contracts.usdt.approve(CONTRACT_CONFIG.morphHolesky.contracts.subscriptionFactory, listing.price);
      await approveTx.wait();

      // 2. 購買
      console.log('從市場購買 NFT...');
      const buyTx = await this.contracts.factory.buySubscription(subscriptionAddress, tokenId);
      const receipt = await buyTx.wait();

      console.log('市場購買成功！交易哈希:', receipt.transactionHash);
      return receipt;

    } catch (error) {
      console.error('市場購買失敗:', error);
      throw error;
    }
  }

  // 獲取市場掛單
  async getMarketListings() {
    const listings = await this.contracts.factory.getMarketListings();
    const formattedListings = [];

    for (const listing of listings) {
      const subscriptionContract = new ethers.Contract(listing.subscriptionContract, SUBSCRIPTION_ABI, this.provider);
      const serviceName = await subscriptionContract.name();

      formattedListings.push({
        subscriptionContract: listing.subscriptionContract,
        tokenId: listing.tokenId.toString(),
        price: ethers.utils.formatUnits(listing.price, 6),
        seller: listing.seller,
        expirationTime: new Date(listing.expirationTime.toNumber() * 1000),
        serviceName
      });
    }

    return formattedListings;
  }

  // 獲取測試 USDT (僅限測試網)
  async getMockUSDT(amount = "1000") {
    if (!this.signer) {
      throw new Error('請先連接錢包');
    }

    const amountWei = ethers.utils.parseUnits(amount, 6);
    const tx = await this.contracts.usdt.mint(this.userAddress, amountWei);
    await tx.wait();
    
    console.log(`已獲得 ${amount} 測試 USDT`);
  }

  // 調試函數：檢查掛單前的所有條件
  async debugListingConditions(subscriptionAddress, tokenId, priceInUSDT) {
    console.log('\n🔍 調試掛單條件...');
    
    try {
      const subscriptionContract = new ethers.Contract(subscriptionAddress, SUBSCRIPTION_ABI, this.provider);
      const price = ethers.utils.parseUnits(priceInUSDT.toString(), 6);

      // 檢查 1: 合約地址是否有效
      const isValid = await this.contracts.factory.isValidCollection(subscriptionAddress);
      console.log(`✅ 合約是否有效: ${isValid}`);

      // 檢查 2: NFT 是否存在
      let owner;
      try {
        owner = await subscriptionContract.ownerOf(tokenId);
        console.log(`✅ NFT 存在，擁有者: ${owner}`);
      } catch {
        console.log('❌ NFT 不存在或無效的 tokenId');
        return;
      }

      // 檢查 3: 用戶是否是擁有者
      const isOwner = owner.toLowerCase() === this.userAddress.toLowerCase();
      console.log(`✅ 用戶是擁有者: ${isOwner}`);

      // 檢查 4: NFT 是否過期
      const expiryTime = await subscriptionContract.getExpiryTime(tokenId);
      const isExpired = expiryTime.toNumber() <= Math.floor(Date.now() / 1000);
      console.log(`✅ NFT 是否過期: ${isExpired}, 過期時間: ${new Date(expiryTime.toNumber() * 1000)}`);

      // 檢查 5: 價格是否合理
      console.log(`✅ 掛單價格: ${ethers.utils.formatUnits(price, 6)} USDT`);

      // 檢查 6: 工廠合約是否已被授權
      const approved = await subscriptionContract.getApproved(tokenId);
      const isApproved = approved.toLowerCase() === CONTRACT_CONFIG.morphHolesky.contracts.subscriptionFactory.toLowerCase();
      console.log(`✅ 工廠合約是否已授權: ${isApproved}, 當前授權地址: ${approved}`);

      console.log('\n📋 總結:');
      if (isValid && isOwner && !isExpired && !price.isZero()) {
        console.log('✅ 所有條件都滿足，應該可以掛單');
      } else {
        console.log('❌ 有條件不滿足，無法掛單');
      }

    } catch (error) {
      console.error('❌ 調試檢查失敗:', error);
    }
  }
}

// 使用示例
async function exampleUsage() {
  const uniSub = new UniSubIntegration();
  
  // 初始化
  await uniSub.initialize();
  
  // 獲取用戶餘額
  const balance = await uniSub.getUSDTBalance();
  console.log('USDT 餘額:', balance);
  
  // 獲取所有服務
  const services = await uniSub.getAllServices();
  console.log('可用服務:', services);
  
  // 購買 Netflix 訂閱
  // await uniSub.purchaseSubscription(CONTRACT_CONFIG.morphHolesky.services.netflixPremium);
  
  // 查看市場掛單
  const listings = await uniSub.getMarketListings();
  console.log('市場掛單:', listings);

  // 調試掛單問題 (如果需要)
  // await uniSub.debugListingConditions(CONTRACT_CONFIG.morphHolesky.services.netflixPremium, 0, "12");
}

// 調試掛單問題的專用函數
async function debugListingIssue() {
  const uniSub = new UniSubIntegration();
  await uniSub.initialize();
  
  // 檢查 Netflix 訂閱的掛單條件
  console.log('🔍 調試 Netflix 訂閱掛單...');
  await uniSub.debugListingConditions(
    CONTRACT_CONFIG.morphHolesky.services.netflixPremium, 
    0, // tokenId
    "12" // 價格 12 USDT
  );
}

export default UniSubIntegration;

// 全域變量供瀏覽器直接使用
window.UniSubIntegration = UniSubIntegration;
window.exampleUsage = exampleUsage;
