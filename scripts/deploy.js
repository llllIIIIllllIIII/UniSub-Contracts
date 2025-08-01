const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying contracts with the account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  
  // Deploy Mock USDT token for testing
  console.log("\n📝 Deploying Mock USDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.deployed();
  console.log("✅ Mock USDT deployed to:", mockUSDT.address);
  
  // Deploy Subscription Factory
  console.log("\n🏭 Deploying SubscriptionFactory...");
  const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
  const factory = await SubscriptionFactory.deploy(mockUSDT.address);
  await factory.deployed();
  console.log("✅ SubscriptionFactory deployed to:", factory.address);
  
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
    const event = receipt.events.find(e => e.event === "CollectionCreated");
    const collectionAddress = event.args.collection;
    
    console.log(`✅ ${collection.name} created at:`, collectionAddress);
    console.log(`   Price: ${ethers.utils.formatUnits(collection.price, 6)} USDT`);
    console.log(`   Duration: ${collection.duration / (24 * 60 * 60)} days`);
    
    createdCollections.push({
      name: collection.name,
      address: collectionAddress,
      price: collection.price,
      duration: collection.duration
    });
  }
  
  // Get and display factory statistics
  console.log("\n📊 Factory Statistics:");
  const [totalCollections, activeCollections, totalProviders] = await factory.getFactoryStats();
  console.log(`   Total Collections: ${totalCollections}`);
  console.log(`   Active Collections: ${activeCollections}`);
  console.log(`   Total Providers: ${totalProviders}`);
  
  // Display all collections
  console.log("\n📋 All Collections:");
  const allCollections = await factory.getAllCollections();
  for (let i = 0; i < allCollections.length; i++) {
    const collectionInfo = await factory.getCollectionInfo(allCollections[i]);
    console.log(`   ${i + 1}. ${collectionInfo.name} (${collectionInfo.symbol})`);
    console.log(`      Address: ${allCollections[i]}`);
    console.log(`      Price: ${ethers.utils.formatUnits(collectionInfo.price, 6)} USDT`);
    console.log(`      Duration: ${collectionInfo.duration / (24 * 60 * 60)} days`);
    console.log(`      Owner: ${collectionInfo.owner}`);
    console.log(`      Status: ${collectionInfo.isActive ? 'Active' : 'Inactive'}`);
  }
  
  // Give deployer some USDT for testing
  console.log("\n💰 Minting USDT for deployer...");
  await mockUSDT.faucet(deployer.address);
  const deployerUSDTBalance = await mockUSDT.balanceOf(deployer.address);
  console.log(`✅ Deployer USDT balance: ${ethers.utils.formatUnits(deployerUSDTBalance, 6)} USDT`);
  
  // Summary
  console.log("\n🎉 Deployment Summary:");
  console.log("==========================================");
  console.log(`Mock USDT: ${mockUSDT.address}`);
  console.log(`Subscription Factory: ${factory.address}`);
  console.log(`Collections Created: ${createdCollections.length}`);
  console.log("==========================================");
  
  // Save deployment info to file
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
      address: c.address,
      price: ethers.utils.formatUnits(c.price, 6),
      duration: c.duration / (24 * 60 * 60)
    }))
  };
  
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
