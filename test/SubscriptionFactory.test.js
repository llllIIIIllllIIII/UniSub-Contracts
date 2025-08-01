const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SubscriptionFactory", function () {
  let factory;
  let mockUSDT;
  let owner, serviceProvider1, serviceProvider2, user1, user2;
  
  const SERVICE_NAME_1 = "Netflix Premium";
  const SERVICE_SYMBOL_1 = "NFLX";
  const PRICE_1 = ethers.utils.parseUnits("15", 6); // 15 USDT
  const DURATION_1 = 30 * 24 * 60 * 60; // 30 days
  
  const SERVICE_NAME_2 = "Spotify Premium";
  const SERVICE_SYMBOL_2 = "SPOT";
  const PRICE_2 = ethers.utils.parseUnits("10", 6); // 10 USDT
  const DURATION_2 = 30 * 24 * 60 * 60; // 30 days

  beforeEach(async function () {
    [owner, serviceProvider1, serviceProvider2, user1, user2] = await ethers.getSigners();
    
    // Deploy Mock USDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.deployed();
    
    // Deploy Factory
    const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
    factory = await SubscriptionFactory.deploy(mockUSDT.address);
    await factory.deployed();
    
    // Give users some USDT for testing
    await mockUSDT.faucet(user1.address);
    await mockUSDT.faucet(user2.address);
  });

  describe("Deployment", function () {
    it("Should set the correct USDT token address", async function () {
      expect(await factory.usdtToken()).to.equal(mockUSDT.address);
    });

    it("Should set the deployer as owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Should start with empty collections", async function () {
      const allCollections = await factory.getAllCollections();
      expect(allCollections.length).to.equal(0);
    });
  });

  describe("Collection Creation", function () {
    it("Should successfully create a subscription collection", async function () {
      const tx = await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_1,
        SERVICE_SYMBOL_1,
        PRICE_1,
        DURATION_1
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "CollectionCreated");
      
      expect(event.args.creator).to.equal(serviceProvider1.address);
      expect(event.args.name).to.equal(SERVICE_NAME_1);
      expect(event.args.price).to.equal(PRICE_1);
      expect(event.args.duration).to.equal(DURATION_1);
      
      // Check if collection is tracked
      const allCollections = await factory.getAllCollections();
      expect(allCollections.length).to.equal(1);
      
      const ownerCollections = await factory.getCollectionsByOwner(serviceProvider1.address);
      expect(ownerCollections.length).to.equal(1);
      
      // Verify collection is valid
      expect(await factory.isValidCollection(allCollections[0])).to.be.true;
    });

    it("Should create multiple collections for same provider", async function () {
      // Create first collection
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_1,
        SERVICE_SYMBOL_1,
        PRICE_1,
        DURATION_1
      );
      
      // Create second collection
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_2,
        SERVICE_SYMBOL_2,
        PRICE_2,
        DURATION_2
      );
      
      const ownerCollections = await factory.getCollectionsByOwner(serviceProvider1.address);
      expect(ownerCollections.length).to.equal(2);
    });

    it("Should allow different providers to create collections", async function () {
      // Provider 1 creates collection
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_1,
        SERVICE_SYMBOL_1,
        PRICE_1,
        DURATION_1
      );
      
      // Provider 2 creates collection
      await factory.connect(serviceProvider2).createSubscriptionCollection(
        SERVICE_NAME_2,
        SERVICE_SYMBOL_2,
        PRICE_2,
        DURATION_2
      );
      
      const provider1Collections = await factory.getCollectionsByOwner(serviceProvider1.address);
      const provider2Collections = await factory.getCollectionsByOwner(serviceProvider2.address);
      
      expect(provider1Collections.length).to.equal(1);
      expect(provider2Collections.length).to.equal(1);
      expect(provider1Collections[0]).to.not.equal(provider2Collections[0]);
    });

    it("Should fail with invalid parameters", async function () {
      // Empty name
      await expect(
        factory.connect(serviceProvider1).createSubscriptionCollection(
          "",
          SERVICE_SYMBOL_1,
          PRICE_1,
          DURATION_1
        )
      ).to.be.revertedWith("Name cannot be empty");

      // Empty symbol
      await expect(
        factory.connect(serviceProvider1).createSubscriptionCollection(
          SERVICE_NAME_1,
          "",
          PRICE_1,
          DURATION_1
        )
      ).to.be.revertedWith("Symbol cannot be empty");

      // Zero price
      await expect(
        factory.connect(serviceProvider1).createSubscriptionCollection(
          SERVICE_NAME_1,
          SERVICE_SYMBOL_1,
          0,
          DURATION_1
        )
      ).to.be.revertedWith("Price must be greater than 0");

      // Zero duration
      await expect(
        factory.connect(serviceProvider1).createSubscriptionCollection(
          SERVICE_NAME_1,
          SERVICE_SYMBOL_1,
          PRICE_1,
          0
        )
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });

  describe("Collection Queries", function () {
    beforeEach(async function () {
      // Create test collections
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_1,
        SERVICE_SYMBOL_1,
        PRICE_1,
        DURATION_1
      );
      
      await factory.connect(serviceProvider2).createSubscriptionCollection(
        SERVICE_NAME_2,
        SERVICE_SYMBOL_2,
        PRICE_2,
        DURATION_2
      );
    });

    it("Should return all collections", async function () {
      const allCollections = await factory.getAllCollections();
      expect(allCollections.length).to.equal(2);
    });

    it("Should return collections by owner", async function () {
      const provider1Collections = await factory.getCollectionsByOwner(serviceProvider1.address);
      const provider2Collections = await factory.getCollectionsByOwner(serviceProvider2.address);
      
      expect(provider1Collections.length).to.equal(1);
      expect(provider2Collections.length).to.equal(1);
    });

    it("Should return active collections", async function () {
      const activeCollections = await factory.getActiveCollections();
      expect(activeCollections.length).to.equal(2);
    });

    it("Should return collection info", async function () {
      const collections = await factory.getAllCollections();
      const collectionInfo = await factory.getCollectionInfo(collections[0]);
      
      expect(collectionInfo.name).to.equal(SERVICE_NAME_1);
      expect(collectionInfo.symbol).to.equal(SERVICE_SYMBOL_1);
      expect(collectionInfo.owner).to.equal(serviceProvider1.address);
      expect(collectionInfo.price).to.equal(PRICE_1);
      expect(collectionInfo.duration).to.equal(DURATION_1);
      expect(collectionInfo.isActive).to.be.true;
    });

    it("Should handle pagination", async function () {
      const [paginatedCollections, total] = await factory.getCollectionsPaginated(0, 1);
      
      expect(total).to.equal(2);
      expect(paginatedCollections.length).to.equal(1);
      
      const [secondPage] = await factory.getCollectionsPaginated(1, 1);
      expect(secondPage.length).to.equal(1);
    });
  });

  describe("User Subscription Queries", function () {
    let collection1Address, collection2Address;
    let subscriptionNFT1, subscriptionNFT2;

    beforeEach(async function () {
      // Create collections
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_1,
        SERVICE_SYMBOL_1,
        PRICE_1,
        DURATION_1
      );
      
      await factory.connect(serviceProvider2).createSubscriptionCollection(
        SERVICE_NAME_2,
        SERVICE_SYMBOL_2,
        PRICE_2,
        DURATION_2
      );
      
      // Get collection addresses
      const allCollections = await factory.getAllCollections();
      collection1Address = allCollections[0];
      collection2Address = allCollections[1];
      
      // Get NFT contract instances
      subscriptionNFT1 = await ethers.getContractAt("SubscriptionNFT", collection1Address);
      subscriptionNFT2 = await ethers.getContractAt("SubscriptionNFT", collection2Address);
      
      // User1 mints subscription from collection1
      await mockUSDT.connect(user1).approve(collection1Address, PRICE_1);
      await subscriptionNFT1.connect(user1).mintSubscription();
      
      // User1 mints subscription from collection2
      await mockUSDT.connect(user1).approve(collection2Address, PRICE_2);
      await subscriptionNFT2.connect(user1).mintSubscription();
    });

    it("Should return user subscriptions across all collections", async function () {
      const [collections, tokenIds, expiryTimes] = await factory.getMySubscriptions(user1.address);
      
      expect(collections.length).to.equal(2);
      expect(tokenIds.length).to.equal(2);
      expect(expiryTimes.length).to.equal(2);
      
      // Each collection should have 1 token
      expect(tokenIds[0].length).to.equal(1);
      expect(tokenIds[1].length).to.equal(1);
    });

    it("Should check if user has any valid subscription", async function () {
      const [hasSubscription, collectionsWithSub] = await factory.hasAnyValidSubscription(user1.address);
      
      expect(hasSubscription).to.be.true;
      expect(collectionsWithSub.length).to.equal(2);
    });

    it("Should return false for user without subscriptions", async function () {
      const [hasSubscription, collectionsWithSub] = await factory.hasAnyValidSubscription(user2.address);
      
      expect(hasSubscription).to.be.false;
      expect(collectionsWithSub.length).to.equal(0);
    });
  });

  describe("Factory Statistics", function () {
    beforeEach(async function () {
      // Create test collections
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_1,
        SERVICE_SYMBOL_1,
        PRICE_1,
        DURATION_1
      );
      
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_2,
        SERVICE_SYMBOL_2,
        PRICE_2,
        DURATION_2
      );
      
      await factory.connect(serviceProvider2).createSubscriptionCollection(
        "Hulu Premium",
        "HULU",
        ethers.utils.parseUnits("12", 6),
        DURATION_1
      );
    });

    it("Should return correct factory statistics", async function () {
      const [totalCollections, activeCollections, totalProviders] = await factory.getFactoryStats();
      
      expect(totalCollections).to.equal(3);
      expect(activeCollections).to.equal(3);
      expect(totalProviders).to.equal(2); // serviceProvider1 and serviceProvider2
    });
  });

  describe("Collection Status Management", function () {
    let collectionAddress;

    beforeEach(async function () {
      await factory.connect(serviceProvider1).createSubscriptionCollection(
        SERVICE_NAME_1,
        SERVICE_SYMBOL_1,
        PRICE_1,
        DURATION_1
      );
      
      const collections = await factory.getAllCollections();
      collectionAddress = collections[0];
    });

    it("Should allow factory owner to toggle collection status", async function () {
      // Initially active
      let collectionInfo = await factory.getCollectionInfo(collectionAddress);
      expect(collectionInfo.isActive).to.be.true;
      
      // Toggle to inactive
      await factory.connect(owner).toggleCollectionStatus(collectionAddress);
      
      collectionInfo = await factory.getCollectionInfo(collectionAddress);
      expect(collectionInfo.isActive).to.be.false;
      
      // Toggle back to active
      await factory.connect(owner).toggleCollectionStatus(collectionAddress);
      
      collectionInfo = await factory.getCollectionInfo(collectionAddress);
      expect(collectionInfo.isActive).to.be.true;
    });

    it("Should fail if non-owner tries to toggle status", async function () {
      await expect(
        factory.connect(serviceProvider1).toggleCollectionStatus(collectionAddress)
      ).to.be.reverted;
    });

    it("Should fail for invalid collection", async function () {
      const invalidAddress = "0x0000000000000000000000000000000000000001";
      
      await expect(
        factory.connect(owner).toggleCollectionStatus(invalidAddress)
      ).to.be.revertedWith("Invalid collection");
    });
  });
});
