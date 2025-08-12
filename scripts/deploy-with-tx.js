const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying contracts with the account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {},
    collections: [],
    transactions: [] // 新增交易記錄
  };
  
  // Deploy Mock USDT token for testing
  console.log("\n📝 Deploying Mock USDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDTTx = await MockUSDT.deploy();
  const mockUSDT = await mockUSDTTx.deployed();
  
  console.log("✅ Mock USDT deployed to:", mockUSDT.address);
  console.log("📋 Deployment TX:", mockUSDT.deployTransaction.hash);
  
  deploymentInfo.contracts.mockUSDT = mockUSDT.address;
  deploymentInfo.transactions.push({
    contract: "MockUSDT",
    address: mockUSDT.address,
    txHash: mockUSDT.deployTransaction.hash,
    blockNumber: mockUSDT.deployTransaction.blockNumber
  });
  
  // Deploy Subscription Factory
  console.log("\n🏭 Deploying SubscriptionFactory...");
  const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
  const factoryTx = await SubscriptionFactory.deploy(mockUSDT.address);
  const factory = await factoryTx.deployed();
  
  console.log("✅ SubscriptionFactory deployed to:", factory.address);
  console.log("📋 Deployment TX:", factory.deployTransaction.hash);
  
  deploymentInfo.contracts.subscriptionFactory = factory.address;
  deploymentInfo.transactions.push({
    contract: "SubscriptionFactory",
    address: factory.address,
    txHash: factory.deployTransaction.hash,
    blockNumber: factory.deployTransaction.blockNumber
  });
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const factoryUSDT = await factory.usdtToken();
  console.log("Factory USDT token:", factoryUSDT);
  console.log("Expected USDT token:", mockUSDT.address);
  console.log("✅ USDT token verification:", factoryUSDT === mockUSDT.address ? "PASSED" : "FAILED");
  
  // Create sample subscription collections for demo
  console.log("\n🎬 Creating sample subscription collections...");
  
  const sampleCollections = [
    {
      name: "Netflix Premium",
      symbol: "NFLX",
      price: ethers.utils.parseUnits("15", 6), // 15 USDT
      duration: 30 * 24 * 60 * 60 // 30 days
    },
    {
      name: "Spotify Premium",
      symbol: "SPOT", 
      price: ethers.utils.parseUnits("10", 6), // 10 USDT
      duration: 30 * 24 * 60 * 60 // 30 days
    },
    {
      name: "YouTube Premium",
      symbol: "YTB",
      price: ethers.utils.parseUnits("12", 6), // 12 USDT
      duration: 30 * 24 * 60 * 60 // 30 days
    }
  ];
  
  const createdCollections = [];
  
  for (const collection of sampleCollections) {
    console.log(`\n📺 Creating ${collection.name} collection...`);
    
    const tx = await factory.createSubscriptionCollection(
      collection.name,
      collection.symbol,
      collection.price,
      collection.duration
    );
    
    const receipt = await tx.wait();
    console.log("📋 Creation TX:", tx.hash);
    console.log("🧾 Block Number:", receipt.blockNumber);
    console.log("⛽ Gas Used:", receipt.gasUsed.toString());
    
    // Get the collection address from event
    const collectionCreatedEvent = receipt.events?.find(e => e.event === 'CollectionCreated');
    const collectionAddress = collectionCreatedEvent?.args?.collection;
    
    console.log(`✅ ${collection.name} created at: ${collectionAddress}`);
    console.log(`   Price: ${ethers.utils.formatUnits(collection.price, 6)} USDT`);
    console.log(`   Duration: ${collection.duration / (24 * 60 * 60)} days`);
    
    createdCollections.push({
      ...collection,
      address: collectionAddress
    });
    
    // 記錄交易信息
    deploymentInfo.transactions.push({
      contract: `${collection.name} (${collection.symbol})`,
      address: collectionAddress,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });
  }
  
  // Display factory statistics
  console.log("\n📊 Factory Statistics:");
  const [totalCollections, activeCollections, totalProviders] = await factory.getFactoryStats();
  console.log("   Total Collections:", totalCollections.toString());
  console.log("   Active Collections:", activeCollections.toString());
  console.log("   Total Providers:", totalProviders.toString());
  
  // Display all collections with details
  console.log("\n📋 All Collections:");
  for (let i = 0; i < createdCollections.length; i++) {
    const collection = createdCollections[i];
    const collectionInfo = await factory.getCollectionInfo(collection.address);
    
    console.log(`   ${i + 1}. ${collection.name} (${collection.symbol})`);
    console.log(`      Address: ${collection.address}`);
    console.log(`      Price: ${ethers.utils.formatUnits(collection.price, 6)} USDT`);
    console.log(`      Duration: ${collection.duration / (24 * 60 * 60)} days`);
    console.log(`      Owner: ${collectionInfo.owner}`);
    console.log(`      Status: ${collectionInfo.isActive ? 'Active' : 'Inactive'}`);
  }
  
  // Give deployer some USDT for testing
  console.log("\n💰 Minting USDT for deployer...");
  const faucetTx = await mockUSDT.faucet(deployer.address);
  const faucetReceipt = await faucetTx.wait();
  console.log("📋 Faucet TX:", faucetTx.hash);
  
  const deployerUSDTBalance = await mockUSDT.balanceOf(deployer.address);
  console.log(`✅ Deployer USDT balance: ${ethers.utils.formatUnits(deployerUSDTBalance, 6)} USDT`);
  
  deploymentInfo.transactions.push({
    contract: "MockUSDT Faucet",
    txHash: faucetTx.hash,
    blockNumber: faucetReceipt.blockNumber,
    gasUsed: faucetReceipt.gasUsed.toString()
  });
  
  // Summary
  console.log("\n🎉 Deployment Summary:");
  console.log("==========================================");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Mock USDT: ${mockUSDT.address}`);
  console.log(`Subscription Factory: ${factory.address}`);
  console.log(`Collections Created: ${createdCollections.length}`);
  console.log("==========================================");
  
  // Transaction Summary
  console.log("\n📋 Transaction Summary:");
  console.log("==========================================");
  deploymentInfo.transactions.forEach((tx, index) => {
    console.log(`${index + 1}. ${tx.contract}`);
    console.log(`   TX Hash: ${tx.txHash}`);
    console.log(`   Block: ${tx.blockNumber || 'Pending'}`);
    if (tx.address) console.log(`   Address: ${tx.address}`);
    if (tx.gasUsed) console.log(`   Gas Used: ${tx.gasUsed}`);
    console.log("");
  });
  
  // Complete deployment info
  deploymentInfo.collections = createdCollections.map(c => ({
    name: c.name,
    symbol: c.symbol,
    address: c.address,
    price: ethers.utils.formatUnits(c.price, 6),
    duration: c.duration / (24 * 60 * 60)
  }));
  
  // Save deployment info to file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}_deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);
  
  // Instructions for next steps
  console.log("\n📖 Next Steps:");
  console.log("1. Test the contracts:");
  console.log("   npx hardhat test");
  console.log("2. Interact with contracts:");
  console.log("   npx hardhat run scripts/interact.js --network localhost");
  console.log("3. Mint USDT for testing:");
  console.log(`   await mockUSDT.faucet(userAddress)`);
  console.log("4. Create subscription:");
  console.log(`   await mockUSDT.approve(collectionAddress, price)`);
  console.log(`   await subscriptionNFT.mintSubscription()`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
