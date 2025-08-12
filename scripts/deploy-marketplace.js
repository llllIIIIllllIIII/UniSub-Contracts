const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🎯 部署帶二手市場功能的合約");
    console.log("🚀 部署賬戶:", deployer.address);
    console.log("💰 賬戶餘額:", ethers.utils.formatEther(await deployer.getBalance()));
    
    // Deploy MockUSDT (if not already deployed)
    console.log("\n📝 部署 Mock USDT...");
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.deployed();
    console.log("✅ Mock USDT 地址:", mockUSDT.address);
    
    // Deploy SubscriptionFactory with marketplace
    console.log("\n🏭 部署帶市場功能的 SubscriptionFactory...");
    const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
    const factory = await SubscriptionFactory.deploy(mockUSDT.address);
    await factory.deployed();
    console.log("✅ SubscriptionFactory 地址:", factory.address);
    
    // Create sample collections
    console.log("\n🎬 創建示例訂閱服務...");
    
    const collections = [
        {
            name: "Netflix Premium",
            symbol: "NFLX",
            price: ethers.utils.parseUnits("15", 6),
            duration: 30 * 24 * 60 * 60 // 30 days
        },
        {
            name: "Spotify Premium", 
            symbol: "SPOT",
            price: ethers.utils.parseUnits("10", 6),
            duration: 30 * 24 * 60 * 60
        }
    ];
    
    const createdCollections = [];
    
    for (const collection of collections) {
        console.log(`\n📺 創建 ${collection.name}...`);
        const tx = await factory.createSubscriptionCollection(
            collection.name,
            collection.symbol, 
            collection.price,
            collection.duration
        );
        const receipt = await tx.wait();
        
        const event = receipt.events?.find(e => e.event === 'CollectionCreated');
        const collectionAddress = event?.args?.collection;
        
        console.log(`✅ ${collection.name} 地址: ${collectionAddress}`);
        createdCollections.push({
            ...collection,
            address: collectionAddress
        });
    }
    
    // Give deployer some USDT
    console.log("\n💰 為部署者提供測試 USDT...");
    await mockUSDT.faucet(deployer.address);
    const balance = await mockUSDT.balanceOf(deployer.address);
    console.log(`✅ 部署者 USDT 餘額: ${ethers.utils.formatUnits(balance, 6)} USDT`);
    
    // Demo marketplace functionality
    console.log("\n🛍️ 演示市場功能...");
    
    // Buy a Netflix subscription
    const netflixCollection = createdCollections[0];
    const netflixContract = await ethers.getContractAt("SubscriptionNFT", netflixCollection.address);
    
    console.log("📱 購買 Netflix 訂閱...");
    await mockUSDT.approve(netflixCollection.address, netflixCollection.price);
    await netflixContract.mintSubscription();
    console.log("✅ NFT #0 已購買");
    
    // List NFT for sale
    console.log("🏪 將 NFT 掛單出售...");
    const salePrice = ethers.utils.parseUnits("12", 6); // 12 USDT
    
    // Approve factory to transfer NFT
    await netflixContract.approve(factory.address, 0);
    await factory.listSubscription(netflixCollection.address, 0, salePrice);
    console.log("✅ NFT #0 已掛單，售價: 12 USDT");
    
    // Check marketplace listings
    const listings = await factory.getMarketListings();
    console.log(`📋 市場目前有 ${listings.length} 個掛單`);
    
    if (listings.length > 0) {
        const listing = listings[0];
        console.log("📄 掛單詳情:");
        console.log(`   - Token ID: ${listing.tokenId}`);
        console.log(`   - 價格: ${ethers.utils.formatUnits(listing.price, 6)} USDT`);
        console.log(`   - 賣家: ${listing.seller}`);
        console.log(`   - 過期時間: ${new Date(listing.expiryTime.toNumber() * 1000).toLocaleString()}`);
    }
    
    // Summary
    console.log("\n🎉 部署完成摘要:");
    console.log("==========================================");
    console.log(`Mock USDT: ${mockUSDT.address}`);
    console.log(`SubscriptionFactory (含市場): ${factory.address}`);
    console.log(`創建的集合數: ${createdCollections.length}`);
    console.log(`市場掛單數: ${listings.length}`);
    console.log("==========================================");
    
    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            mockUSDT: mockUSDT.address,
            subscriptionFactory: factory.address
        },
        collections: createdCollections.map(c => ({
            name: c.name,
            symbol: c.symbol,
            address: c.address,
            price: ethers.utils.formatUnits(c.price, 6),
            duration: c.duration / (24 * 60 * 60)
        })),
        marketplace: {
            totalListings: listings.length,
            demoListing: listings.length > 0 ? {
                tokenId: listings[0].tokenId.toString(),
                price: ethers.utils.formatUnits(listings[0].price, 6),
                seller: listings[0].seller
            } : null
        }
    };
    
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}_marketplace_deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`📄 部署信息已保存到: ${deploymentFile}`);
    
    console.log("\n📖 接下來的步驟:");
    console.log("1. 測試市場功能:");
    console.log("   npx hardhat test test/SubscriptionMarketplace.test.js");
    console.log("2. 前端集成參考:");
    console.log("   查看 frontend-integration-example.js");
    console.log("3. 市場功能:");
    console.log("   ✅ 掛單出售 NFT");
    console.log("   ✅ 購買他人 NFT");
    console.log("   ✅ 取消掛單");
    console.log("   ✅ 查看市場列表");
    console.log("   ✅ 無平台手續費");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失敗:", error);
        process.exit(1);
    });
