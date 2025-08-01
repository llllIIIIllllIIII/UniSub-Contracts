const { ethers } = require("hardhat");

async function main() {
  console.log("🎮 UniSub Contract Interaction Demo");
  console.log("=====================================");
  
  // Load deployment info
  const fs = require('fs');
  const path = require('path');
  const deploymentFile = path.join(__dirname, '..', 'deployments', `${hre.network.name}_deployment.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ Deployment file not found. Please run deploy script first.");
    console.log("   npx hardhat run scripts/deploy.js --network localhost");
    return;
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log("📄 Loaded deployment info from:", deploymentFile);
  
  // Get contracts
  const mockUSDT = await ethers.getContractAt("MockUSDT", deploymentInfo.contracts.mockUSDT);
  const factory = await ethers.getContractAt("SubscriptionFactory", deploymentInfo.contracts.subscriptionFactory);
  
  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address);
  
  // Give users USDT for testing
  console.log("\n💰 Distributing USDT to users...");
  await mockUSDT.faucet(user1.address);
  await mockUSDT.faucet(user2.address);
  
  const user1Balance = await mockUSDT.balanceOf(user1.address);
  const user2Balance = await mockUSDT.balanceOf(user2.address);
  console.log(`✅ User1 USDT balance: ${ethers.utils.formatUnits(user1Balance, 6)} USDT`);
  console.log(`✅ User2 USDT balance: ${ethers.utils.formatUnits(user2Balance, 6)} USDT`);
  
  // Get available collections
  console.log("\n📋 Available Subscription Collections:");
  const allCollections = await factory.getAllCollections();
  
  const collectionsData = [];
  for (let i = 0; i < allCollections.length; i++) {
    const collectionInfo = await factory.getCollectionInfo(allCollections[i]);
    collectionsData.push({
      address: allCollections[i],
      info: collectionInfo
    });
    
    console.log(`   ${i + 1}. ${collectionInfo.name} (${collectionInfo.symbol})`);
    console.log(`      Price: ${ethers.utils.formatUnits(collectionInfo.price, 6)} USDT`);
    console.log(`      Duration: ${collectionInfo.duration / (24 * 60 * 60)} days`);
  }
  
  if (collectionsData.length === 0) {
    console.log("❌ No collections found. Deploy script should have created sample collections.");
    return;
  }
  
  // Demo: User1 subscribes to Netflix
  console.log("\n🎬 Demo: User1 subscribes to Netflix...");
  const netflixCollection = collectionsData[0]; // Assuming first collection is Netflix
  const subscriptionNFT = await ethers.getContractAt("SubscriptionNFT", netflixCollection.address);
  
  // Approve USDT spending
  console.log("💳 Approving USDT spending...");
  await mockUSDT.connect(user1).approve(netflixCollection.address, netflixCollection.info.price);
  
  // Mint subscription
  console.log("🪙 Minting subscription NFT...");
  const mintTx = await subscriptionNFT.connect(user1).mintSubscription();
  const receipt = await mintTx.wait();
  
  const event = receipt.events.find(e => e.event === "SubscriptionMinted");
  console.log(`✅ Subscription NFT minted! Token ID: ${event.args.tokenId}`);
  console.log(`   Expiry: ${new Date(event.args.expiryTime * 1000).toLocaleString()}`);
  
  // Check subscription status
  console.log("\n🔍 Checking subscription status...");
  const hasValidSub = await subscriptionNFT.hasValidSubscription(user1.address);
  console.log(`✅ User1 has valid subscription: ${hasValidSub}`);
  
  // Get user's subscriptions
  const [userTokens, userExpiries] = await subscriptionNFT.getUserValidSubscriptions(user1.address);
  console.log(`📋 User1's valid subscriptions: ${userTokens.length}`);
  for (let i = 0; i < userTokens.length; i++) {
    console.log(`   Token ${userTokens[i]}: expires ${new Date(userExpiries[i] * 1000).toLocaleString()}`);
  }
  
  // Demo: User1 subscribes to Spotify as well
  if (collectionsData.length > 1) {
    console.log("\n🎵 Demo: User1 also subscribes to Spotify...");
    const spotifyCollection = collectionsData[1];
    const spotifyNFT = await ethers.getContractAt("SubscriptionNFT", spotifyCollection.address);
    
    await mockUSDT.connect(user1).approve(spotifyCollection.address, spotifyCollection.info.price);
    await spotifyNFT.connect(user1).mintSubscription();
    console.log("✅ Spotify subscription minted!");
  }
  
  // Get all user subscriptions across collections using factory
  console.log("\n📊 User1's subscriptions across all platforms:");
  const [collections, tokenIds, expiryTimes] = await factory.getMySubscriptions(user1.address);
  
  for (let i = 0; i < collections.length; i++) {
    const collectionInfo = await factory.getCollectionInfo(collections[i]);
    console.log(`   ${collectionInfo.name}:`);
    
    for (let j = 0; j < tokenIds[i].length; j++) {
      console.log(`     Token ${tokenIds[i][j]}: expires ${new Date(expiryTimes[i][j] * 1000).toLocaleString()}`);
    }
  }
  
  // Check if user has any valid subscription
  const [hasAnySub, collectionsWithSub] = await factory.hasAnyValidSubscription(user1.address);
  console.log(`\n✅ User1 has valid subscriptions: ${hasAnySub}`);
  console.log(`📋 Active in ${collectionsWithSub.length} collections`);
  
  // Demo: Renewal
  console.log("\n🔄 Demo: Renewing Netflix subscription...");
  const tokenId = userTokens[0];
  const originalExpiry = await subscriptionNFT.getExpiryTime(tokenId);
  
  await mockUSDT.connect(user1).approve(netflixCollection.address, netflixCollection.info.price);
  await subscriptionNFT.connect(user1).renewSubscription(tokenId);
  
  const newExpiry = await subscriptionNFT.getExpiryTime(tokenId);
  console.log(`✅ Subscription renewed!`);
  console.log(`   Original expiry: ${new Date(originalExpiry * 1000).toLocaleString()}`);
  console.log(`   New expiry: ${new Date(newExpiry * 1000).toLocaleString()}`);
  
  // Demo: Transfer NFT (if enabled)
  console.log("\n↗️ Demo: Transferring NFT from User1 to User2...");
  try {
    await subscriptionNFT.connect(user1).transferFrom(user1.address, user2.address, tokenId);
    console.log("✅ NFT transferred successfully!");
    
    // Check new owner's subscription status
    const user2HasSub = await subscriptionNFT.hasValidSubscription(user2.address);
    const user1HasSubAfterTransfer = await subscriptionNFT.hasValidSubscription(user1.address);
    
    console.log(`   User1 has subscription after transfer: ${user1HasSubAfterTransfer}`);
    console.log(`   User2 has subscription after transfer: ${user2HasSub}`);
  } catch (error) {
    console.log("❌ NFT transfer failed (might be restricted):", error.message);
  }
  
  // Factory statistics
  console.log("\n📈 Factory Statistics:");
  const [totalCols, activeCols, totalProviders] = await factory.getFactoryStats();
  console.log(`   Total Collections: ${totalCols}`);
  console.log(`   Active Collections: ${activeCols}`);
  console.log(`   Total Providers: ${totalProviders}`);
  
  // Contract information
  console.log("\n📋 Contract Information:");
  const [serviceName, price, duration, totalSupply] = await subscriptionNFT.getContractInfo();
  console.log(`   Service: ${serviceName}`);
  console.log(`   Price: ${ethers.utils.formatUnits(price, 6)} USDT`);
  console.log(`   Duration: ${duration / (24 * 60 * 60)} days`);
  console.log(`   Total NFTs minted: ${totalSupply}`);
  
  // USDT balances after all transactions
  console.log("\n💰 Final USDT Balances:");
  const finalUser1Balance = await mockUSDT.balanceOf(user1.address);
  const finalUser2Balance = await mockUSDT.balanceOf(user2.address);
  const serviceProviderBalance = await mockUSDT.balanceOf(deployer.address);
  
  console.log(`   User1: ${ethers.utils.formatUnits(finalUser1Balance, 6)} USDT`);
  console.log(`   User2: ${ethers.utils.formatUnits(finalUser2Balance, 6)} USDT`);
  console.log(`   Service Provider: ${ethers.utils.formatUnits(serviceProviderBalance, 6)} USDT`);
  
  // Demo complete
  console.log("\n🎉 Demo completed successfully!");
  console.log("=====================================");
  
  // Instructions for manual testing
  console.log("\n📖 Manual Testing Instructions:");
  console.log("1. Check subscription status:");
  console.log(`   await subscriptionNFT.hasValidSubscription("${user1.address}")`);
  console.log("2. Get user subscriptions:");
  console.log(`   await factory.getMySubscriptions("${user1.address}")`);
  console.log("3. Mint USDT for testing:");
  console.log(`   await mockUSDT.faucet("YOUR_ADDRESS")`);
  console.log("4. Create new subscription:");
  console.log(`   await mockUSDT.approve(collectionAddress, price)`);
  console.log(`   await subscriptionNFT.mintSubscription()`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction demo failed:", error);
    process.exit(1);
  });
