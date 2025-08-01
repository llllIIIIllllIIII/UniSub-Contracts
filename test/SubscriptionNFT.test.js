const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SubscriptionNFT", function () {
  let subscriptionNFT;
  let mockUSDT;
  let factory;
  let owner, serviceProvider, user1, user2;
  
  const SERVICE_NAME = "Netflix Premium";
  const SERVICE_SYMBOL = "NFLX";
  const SUBSCRIPTION_PRICE = ethers.utils.parseUnits("15", 6); // 15 USDT
  const SUBSCRIPTION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

  beforeEach(async function () {
    [owner, serviceProvider, user1, user2] = await ethers.getSigners();
    
    // Deploy Mock USDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.deployed();
    
    // Deploy Factory
    const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
    factory = await SubscriptionFactory.deploy(mockUSDT.address);
    await factory.deployed();
    
    // Create subscription collection through factory
    await factory.connect(serviceProvider).createSubscriptionCollection(
      SERVICE_NAME,
      SERVICE_SYMBOL,
      SUBSCRIPTION_PRICE,
      SUBSCRIPTION_DURATION
    );
    
    // Get the created collection address
    const collections = await factory.getCollectionsByOwner(serviceProvider.address);
    const subscriptionNFTAddress = collections[0];
    
    // Get SubscriptionNFT instance
    subscriptionNFT = await ethers.getContractAt("SubscriptionNFT", subscriptionNFTAddress);
    
    // Give users some USDT for testing
    await mockUSDT.faucet(user1.address);
    await mockUSDT.faucet(user2.address);
  });

  describe("Deployment", function () {
    it("Should set the correct service provider as owner", async function () {
      expect(await subscriptionNFT.owner()).to.equal(serviceProvider.address);
    });

    it("Should set the correct price and duration", async function () {
      expect(await subscriptionNFT.price()).to.equal(SUBSCRIPTION_PRICE);
      expect(await subscriptionNFT.duration()).to.equal(SUBSCRIPTION_DURATION);
    });

    it("Should set the correct USDT token address", async function () {
      expect(await subscriptionNFT.usdtToken()).to.equal(mockUSDT.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await subscriptionNFT.name()).to.equal(SERVICE_NAME);
      expect(await subscriptionNFT.symbol()).to.equal(SERVICE_SYMBOL);
    });
  });

  describe("Subscription Minting", function () {
    it("Should successfully mint subscription NFT", async function () {
      // Approve USDT spending
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      
      // Mint subscription
      const tx = await subscriptionNFT.connect(user1).mintSubscription();
      const receipt = await tx.wait();
      
      // Check if NFT was minted
      expect(await subscriptionNFT.balanceOf(user1.address)).to.equal(1);
      expect(await subscriptionNFT.ownerOf(0)).to.equal(user1.address);
      
      // Check event emission
      const event = receipt.events.find(e => e.event === "SubscriptionMinted");
      expect(event.args.user).to.equal(user1.address);
      expect(event.args.tokenId).to.equal(0);
    });

    it("Should fail if insufficient USDT allowance", async function () {
      // Don't approve USDT spending
      await expect(
        subscriptionNFT.connect(user1).mintSubscription()
      ).to.be.reverted;
    });

    it("Should fail if insufficient USDT balance", async function () {
      // User with no USDT tries to mint
      const [, , , userWithNoUSDT] = await ethers.getSigners();
      
      await expect(
        subscriptionNFT.connect(userWithNoUSDT).mintSubscription()
      ).to.be.reverted;
    });

    it("Should transfer USDT to service provider", async function () {
      const initialBalance = await mockUSDT.balanceOf(serviceProvider.address);
      
      // Approve and mint
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      await subscriptionNFT.connect(user1).mintSubscription();
      
      const finalBalance = await mockUSDT.balanceOf(serviceProvider.address);
      expect(finalBalance.sub(initialBalance)).to.equal(SUBSCRIPTION_PRICE);
    });

    it("Should set correct expiry time", async function () {
      // Approve and mint
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      
      const mintTx = await subscriptionNFT.connect(user1).mintSubscription();
      const receipt = await mintTx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const expiryTime = await subscriptionNFT.getExpiryTime(0);
      const expectedExpiry = block.timestamp + SUBSCRIPTION_DURATION;
      
      expect(expiryTime).to.equal(expectedExpiry);
    });
  });

  describe("Subscription Validation", function () {
    beforeEach(async function () {
      // Mint a subscription for user1
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      await subscriptionNFT.connect(user1).mintSubscription();
    });

    it("Should return true for valid subscription", async function () {
      expect(await subscriptionNFT.hasValidSubscription(user1.address)).to.be.true;
    });

    it("Should return false for user without subscription", async function () {
      expect(await subscriptionNFT.hasValidSubscription(user2.address)).to.be.false;
    });

    it("Should return false for expired subscription", async function () {
      // Fast forward time beyond subscription duration
      await ethers.provider.send("evm_increaseTime", [SUBSCRIPTION_DURATION + 1]);
      await ethers.provider.send("evm_mine");
      
      expect(await subscriptionNFT.hasValidSubscription(user1.address)).to.be.false;
    });

    it("Should correctly identify expired subscriptions", async function () {
      // Initially not expired
      expect(await subscriptionNFT.isExpired(0)).to.be.false;
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [SUBSCRIPTION_DURATION + 1]);
      await ethers.provider.send("evm_mine");
      
      // Now expired
      expect(await subscriptionNFT.isExpired(0)).to.be.true;
    });
  });

  describe("Subscription Renewal", function () {
    beforeEach(async function () {
      // Mint initial subscription
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      await subscriptionNFT.connect(user1).mintSubscription();
    });

    it("Should successfully renew subscription", async function () {
      const initialExpiry = await subscriptionNFT.getExpiryTime(0);
      
      // Approve and renew
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      await subscriptionNFT.connect(user1).renewSubscription(0);
      
      const newExpiry = await subscriptionNFT.getExpiryTime(0);
      expect(newExpiry.sub(initialExpiry)).to.equal(SUBSCRIPTION_DURATION);
    });

    it("Should renew from current time if subscription expired", async function () {
      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [SUBSCRIPTION_DURATION + 100]);
      await ethers.provider.send("evm_mine");
      
      // Renew subscription
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      const renewTx = await subscriptionNFT.connect(user1).renewSubscription(0);
      const receipt = await renewTx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const newExpiry = await subscriptionNFT.getExpiryTime(0);
      const expectedExpiry = block.timestamp + SUBSCRIPTION_DURATION;
      
      expect(newExpiry).to.equal(expectedExpiry);
    });

    it("Should fail if not token owner", async function () {
      await mockUSDT.connect(user2).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE);
      
      await expect(
        subscriptionNFT.connect(user2).renewSubscription(0)
      ).to.be.revertedWith("Not token owner");
    });
  });

  describe("User Token Queries", function () {
    beforeEach(async function () {
      // Mint multiple subscriptions for user1
      await mockUSDT.connect(user1).approve(subscriptionNFT.address, SUBSCRIPTION_PRICE.mul(2));
      await subscriptionNFT.connect(user1).mintSubscription(); // Token 0
      await subscriptionNFT.connect(user1).mintSubscription(); // Token 1
    });

    it("Should return all user tokens", async function () {
      const userTokens = await subscriptionNFT.getUserTokens(user1.address);
      expect(userTokens.length).to.equal(2);
      expect(userTokens[0]).to.equal(0);
      expect(userTokens[1]).to.equal(1);
    });

    it("Should return valid subscriptions", async function () {
      const [tokenIds, expiryTimes] = await subscriptionNFT.getUserValidSubscriptions(user1.address);
      expect(tokenIds.length).to.equal(2);
      expect(expiryTimes.length).to.equal(2);
    });

    it("Should filter out expired subscriptions", async function () {
      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [SUBSCRIPTION_DURATION + 1]);
      await ethers.provider.send("evm_mine");
      
      const [tokenIds] = await subscriptionNFT.getUserValidSubscriptions(user1.address);
      expect(tokenIds.length).to.equal(0);
    });
  });

  describe("Contract Information", function () {
    it("Should return correct contract info", async function () {
      const [serviceName, price, duration, totalSupply] = await subscriptionNFT.getContractInfo();
      
      expect(serviceName).to.equal(SERVICE_NAME);
      expect(price).to.equal(SUBSCRIPTION_PRICE);
      expect(duration).to.equal(SUBSCRIPTION_DURATION);
      expect(totalSupply).to.equal(0); // No tokens minted yet
    });
  });
});
