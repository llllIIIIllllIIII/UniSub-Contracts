const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SubscriptionFactory Marketplace", function () {
    let mockUSDT, factory, nftContract;
    let owner, user1, user2, serviceProvider;
    let collectionAddress;

    beforeEach(async function () {
        [owner, user1, user2, serviceProvider] = await ethers.getSigners();

        // Deploy MockUSDT
        const MockUSDT = await ethers.getContractFactory("MockUSDT");
        mockUSDT = await MockUSDT.deploy();
        await mockUSDT.deployed();

        // Deploy Factory
        const SubscriptionFactory = await ethers.getContractFactory("SubscriptionFactory");
        factory = await SubscriptionFactory.deploy(mockUSDT.address);
        await factory.deployed();

        // Create a test collection
        await factory.connect(serviceProvider).createSubscriptionCollection(
            "Test Service",
            "TEST",
            ethers.utils.parseUnits("10", 6), // 10 USDT
            30 * 24 * 60 * 60 // 30 days
        );

        const collections = await factory.getAllCollections();
        collectionAddress = collections[0];
        nftContract = await ethers.getContractAt("SubscriptionNFT", collectionAddress);

        // Give users some USDT
        await mockUSDT.faucet(user1.address);
        await mockUSDT.faucet(user2.address);

        // User1 buys a subscription
        await mockUSDT.connect(user1).approve(collectionAddress, ethers.utils.parseUnits("10", 6));
        await nftContract.connect(user1).mintSubscription();
    });

    describe("Listing NFT", function () {
        it("Should allow user to list their NFT", async function () {
            const price = ethers.utils.parseUnits("8", 6); // 8 USDT
            
            // User1 needs to approve factory to transfer their NFT
            await nftContract.connect(user1).approve(factory.address, 0);
            await factory.connect(user1).listSubscription(collectionAddress, 0, price);
            
            const listings = await factory.getMarketListings();
            expect(listings.length).to.equal(1);
            expect(listings[0].seller).to.equal(user1.address);
            expect(listings[0].price).to.equal(price);
            expect(listings[0].tokenId).to.equal(0);
        });

        it("Should not allow non-owner to list NFT", async function () {
            const price = ethers.utils.parseUnits("8", 6);
            
            await expect(
                factory.connect(user2).listSubscription(collectionAddress, 0, price)
            ).to.be.revertedWith("Not token owner");
        });

        it("Should not allow zero price", async function () {
            await expect(
                factory.connect(user1).listSubscription(collectionAddress, 0, 0)
            ).to.be.revertedWith("Price must be greater than 0");
        });
    });

    describe("Buying NFT", function () {
        let listingId;

        beforeEach(async function () {
            const price = ethers.utils.parseUnits("8", 6);
            
            // User1 needs to approve factory to transfer their NFT
            await nftContract.connect(user1).approve(factory.address, 0);
            await factory.connect(user1).listSubscription(collectionAddress, 0, price);
            
            const listings = await factory.getMarketListings();
            listingId = listings[0].listingId;
        });

        it("Should allow user to buy listed NFT", async function () {
            const price = ethers.utils.parseUnits("8", 6);
            
            // Check initial balances
            const initialSellerBalance = await mockUSDT.balanceOf(user1.address);
            const initialBuyerBalance = await mockUSDT.balanceOf(user2.address);
            
            // Approve USDT and buy
            await mockUSDT.connect(user2).approve(factory.address, price);
            await factory.connect(user2).buySubscription(listingId);
            
            // Check NFT ownership changed
            expect(await nftContract.ownerOf(0)).to.equal(user2.address);
            
            // Check USDT transferred
            expect(await mockUSDT.balanceOf(user1.address)).to.equal(initialSellerBalance.add(price));
            expect(await mockUSDT.balanceOf(user2.address)).to.equal(initialBuyerBalance.sub(price));
            
            // Check listing is inactive
            const listings = await factory.getMarketListings();
            expect(listings.length).to.equal(0);
        });

        it("Should not allow seller to buy their own NFT", async function () {
            await expect(
                factory.connect(user1).buySubscription(listingId)
            ).to.be.revertedWith("Cannot buy your own NFT");
        });

        it("Should not allow buying inactive listing", async function () {
            // Cancel listing first
            await factory.connect(user1).cancelListing(listingId);
            
            await expect(
                factory.connect(user2).buySubscription(listingId)
            ).to.be.revertedWith("Listing not active");
        });
    });

    describe("Cancel Listing", function () {
        let listingId;

        beforeEach(async function () {
            const price = ethers.utils.parseUnits("8", 6);
            
            // User1 needs to approve factory to transfer their NFT
            await nftContract.connect(user1).approve(factory.address, 0);
            await factory.connect(user1).listSubscription(collectionAddress, 0, price);
            
            const listings = await factory.getMarketListings();
            listingId = listings[0].listingId;
        });

        it("Should allow seller to cancel listing", async function () {
            await factory.connect(user1).cancelListing(listingId);
            
            const listings = await factory.getMarketListings();
            expect(listings.length).to.equal(0);
        });

        it("Should not allow non-seller to cancel listing", async function () {
            await expect(
                factory.connect(user2).cancelListing(listingId)
            ).to.be.revertedWith("Not your listing");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            // Create multiple listings
            const price1 = ethers.utils.parseUnits("8", 6);
            
            // User1 needs to approve factory to transfer their NFT
            await nftContract.connect(user1).approve(factory.address, 0);
            await factory.connect(user1).listSubscription(collectionAddress, 0, price1);
            
            // User2 gets an NFT and lists it
            await mockUSDT.connect(user2).approve(collectionAddress, ethers.utils.parseUnits("10", 6));
            await nftContract.connect(user2).mintSubscription();
            
            const price2 = ethers.utils.parseUnits("12", 6);
            
            // User2 needs to approve factory to transfer their NFT
            await nftContract.connect(user2).approve(factory.address, 1);
            await factory.connect(user2).listSubscription(collectionAddress, 1, price2);
        });

        it("Should return all market listings", async function () {
            const listings = await factory.getMarketListings();
            expect(listings.length).to.equal(2);
        });

        it("Should return listings by collection", async function () {
            const listings = await factory.getListingsByCollection(collectionAddress);
            expect(listings.length).to.equal(2);
        });

        it("Should return user listings", async function () {
            const user1Listings = await factory.getUserListings(user1.address);
            const user2Listings = await factory.getUserListings(user2.address);
            
            expect(user1Listings.length).to.equal(1);
            expect(user2Listings.length).to.equal(1);
            expect(user1Listings[0].seller).to.equal(user1.address);
            expect(user2Listings[0].seller).to.equal(user2.address);
        });
    });

    describe("Expired NFT Trading", function () {
        it("Should allow trading expired NFTs", async function () {
            // Fast forward time to expire the NFT
            await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
            await ethers.provider.send("evm_mine");
            
            const price = ethers.utils.parseUnits("5", 6); // Lower price for expired NFT
            
            // User1 needs to approve factory to transfer their NFT
            await nftContract.connect(user1).approve(factory.address, 0);
            
            // Should still be able to list expired NFT
            await factory.connect(user1).listSubscription(collectionAddress, 0, price);
            
            const listings = await factory.getMarketListings();
            expect(listings.length).to.equal(1);
            expect(listings[0].price).to.equal(price);
            
            // Buyer should be able to see expiry time
            const expiryTime = listings[0].expiryTime;
            expect(expiryTime).to.be.gt(0);
        });
    });
});
