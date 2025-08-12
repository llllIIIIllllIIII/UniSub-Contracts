// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SubscriptionNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SubscriptionFactory
 * @dev Factory contract to create and manage subscription NFT collections
 * Service providers can deploy their own subscription NFT contracts
 */
contract SubscriptionFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // USDT token address for all subscriptions
    address public immutable usdtToken;
    
    // Array of all created collections
    address[] public allCollections;
    
    // Mapping from service provider to their collections
    mapping(address => address[]) public collectionsByOwner;
    
    // Mapping to verify if an address is a valid collection
    mapping(address => bool) public isValidCollection;
    
    // Mapping from collection address to collection info
    mapping(address => CollectionInfo) public collectionInfo;
    
    // Collection metadata
    struct CollectionInfo {
        string name;
        string symbol;
        address owner;
        uint256 price;
        uint256 duration;
        uint256 createdAt;
        bool isActive;
    }
    
    // Events
    event CollectionCreated(
        address indexed creator,
        address indexed collection,
        string name,
        string symbol,
        uint256 price,
        uint256 duration
    );
    
    event CollectionStatusChanged(
        address indexed collection,
        bool isActive
    );

    /**
     * @dev Constructor
     * @param _usdtToken Address of the USDT token contract
     */
    constructor(address _usdtToken) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        usdtToken = _usdtToken;
    }

    /**
     * @dev Create a new subscription NFT collection
     * @param name Name of the subscription service
     * @param symbol Symbol for the NFT collection
     * @param price Price in USDT (with 6 decimals)
     * @param duration Subscription duration in seconds
     * @return collection Address of the created collection contract
     */
    function createSubscriptionCollection(
        string memory name,
        string memory symbol,
        uint256 price,
        uint256 duration
    ) external nonReentrant returns (address collection) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(price > 0, "Price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        
        // Deploy new SubscriptionNFT contract
        SubscriptionNFT newCollection = new SubscriptionNFT(
            name,
            symbol,
            usdtToken,
            price,
            duration,
            msg.sender
        );
        
        collection = address(newCollection);
        
        // Store collection information
        collectionInfo[collection] = CollectionInfo({
            name: name,
            symbol: symbol,
            owner: msg.sender,
            price: price,
            duration: duration,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Add to tracking arrays
        allCollections.push(collection);
        collectionsByOwner[msg.sender].push(collection);
        isValidCollection[collection] = true;
        
        emit CollectionCreated(
            msg.sender,
            collection,
            name,
            symbol,
            price,
            duration
        );
    }

    /**
     * @dev Get all collections created by a specific owner
     * @param owner Address of the service provider
     * @return address[] Array of collection addresses
     */
    function getCollectionsByOwner(address owner) external view returns (address[] memory) {
        return collectionsByOwner[owner];
    }

    /**
     * @dev Get all collections
     * @return address[] Array of all collection addresses
     */
    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }

    /**
     * @dev Get active collections only
     * @return activeCollections Array of active collection addresses
     */
    function getActiveCollections() external view returns (address[] memory activeCollections) {
        uint256 activeCount = 0;
        
        // Count active collections
        for (uint256 i = 0; i < allCollections.length; i++) {
            if (collectionInfo[allCollections[i]].isActive) {
                activeCount++;
            }
        }
        
        // Populate active collections array
        activeCollections = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allCollections.length; i++) {
            if (collectionInfo[allCollections[i]].isActive) {
                activeCollections[index] = allCollections[i];
                index++;
            }
        }
    }

    /**
     * @dev Get user's subscriptions across all collections
     * @param user Address of the user
     * @return collections Array of collection addresses where user has subscriptions
     * @return tokenIds Array of arrays containing token IDs for each collection
     * @return expiryTimes Array of arrays containing expiry times for each collection
     */
    function getMySubscriptions(address user) 
        external 
        view 
        returns (
            address[] memory collections,
            uint256[][] memory tokenIds,
            uint256[][] memory expiryTimes
        ) 
    {
        uint256 subscriptionCount = 0;
        
        // First pass: count collections where user has subscriptions
        for (uint256 i = 0; i < allCollections.length; i++) {
            address collection = allCollections[i];
            if (isValidCollection[collection]) {
                SubscriptionNFT nft = SubscriptionNFT(collection);
                (uint256[] memory userTokens,) = nft.getUserValidSubscriptions(user);
                if (userTokens.length > 0) {
                    subscriptionCount++;
                }
            }
        }
        
        // Initialize return arrays
        collections = new address[](subscriptionCount);
        tokenIds = new uint256[][](subscriptionCount);
        expiryTimes = new uint256[][](subscriptionCount);
        
        // Second pass: populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < allCollections.length; i++) {
            address collection = allCollections[i];
            if (isValidCollection[collection]) {
                SubscriptionNFT nft = SubscriptionNFT(collection);
                (uint256[] memory userTokens, uint256[] memory expiries) = nft.getUserValidSubscriptions(user);
                
                if (userTokens.length > 0) {
                    collections[index] = collection;
                    tokenIds[index] = userTokens;
                    expiryTimes[index] = expiries;
                    index++;
                }
            }
        }
    }

    /**
     * @dev Get detailed information about a collection
     * @param collection Address of the collection
     * @return info CollectionInfo struct
     */
    function getCollectionInfo(address collection) external view returns (CollectionInfo memory info) {
        require(isValidCollection[collection], "Invalid collection");
        return collectionInfo[collection];
    }

    /**
     * @dev Get collections with pagination
     * @param offset Starting index
     * @param limit Number of collections to return
     * @return paginatedCollections Array of collection addresses
     * @return total Total number of collections
     */
    function getCollectionsPaginated(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory paginatedCollections, uint256 total) 
    {
        total = allCollections.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 length = end - offset;
        paginatedCollections = new address[](length);
        
        for (uint256 i = 0; i < length; i++) {
            paginatedCollections[i] = allCollections[offset + i];
        }
    }

    /**
     * @dev Toggle collection active status (only factory owner)
     * @param collection Address of the collection
     */
    function toggleCollectionStatus(address collection) external onlyOwner {
        require(isValidCollection[collection], "Invalid collection");
        
        collectionInfo[collection].isActive = !collectionInfo[collection].isActive;
        
        emit CollectionStatusChanged(collection, collectionInfo[collection].isActive);
    }

    /**
     * @dev Get factory statistics
     * @return totalCollections Total number of collections created
     * @return activeCollections Number of active collections
     * @return totalProviders Number of unique service providers
     */
    function getFactoryStats() 
        external 
        view 
        returns (
            uint256 totalCollections,
            uint256 activeCollections,
            uint256 totalProviders
        ) 
    {
        totalCollections = allCollections.length;
        
        // Count active collections
        for (uint256 i = 0; i < allCollections.length; i++) {
            if (collectionInfo[allCollections[i]].isActive) {
                activeCollections++;
            }
        }
        
        // Count unique providers (simplified - may include duplicates)
        // In a production environment, you might want to maintain a separate mapping
        totalProviders = 0;
        address[] memory seenProviders = new address[](totalCollections);
        
        for (uint256 i = 0; i < allCollections.length; i++) {
            address provider = collectionInfo[allCollections[i]].owner;
            bool isNew = true;
            
            for (uint256 j = 0; j < totalProviders; j++) {
                if (seenProviders[j] == provider) {
                    isNew = false;
                    break;
                }
            }
            
            if (isNew) {
                seenProviders[totalProviders] = provider;
                totalProviders++;
            }
        }
    }

    /**
     * @dev Check if user has valid subscription in any collection
     * @param user Address to check
     * @return hasSubscription True if user has at least one valid subscription
     * @return collectionsWithSubscription Array of collections where user has valid subscriptions
     */
    function hasAnyValidSubscription(address user) 
        external 
        view 
        returns (
            bool hasSubscription,
            address[] memory collectionsWithSubscription
        ) 
    {
        uint256 validCount = 0;
        
        // First pass: count collections with valid subscriptions
        for (uint256 i = 0; i < allCollections.length; i++) {
            address collection = allCollections[i];
            if (isValidCollection[collection] && collectionInfo[collection].isActive) {
                SubscriptionNFT nft = SubscriptionNFT(collection);
                if (nft.hasValidSubscription(user)) {
                    validCount++;
                }
            }
        }
        
        hasSubscription = validCount > 0;
        collectionsWithSubscription = new address[](validCount);
        
        // Second pass: populate array
        uint256 index = 0;
        for (uint256 i = 0; i < allCollections.length; i++) {
            address collection = allCollections[i];
            if (isValidCollection[collection] && collectionInfo[collection].isActive) {
                SubscriptionNFT nft = SubscriptionNFT(collection);
                if (nft.hasValidSubscription(user)) {
                    collectionsWithSubscription[index] = collection;
                    index++;
                }
            }
        }
    }

    // =====================================================================
    // MARKETPLACE FUNCTIONALITY (MVP for Hackathon Demo)
    // =====================================================================
    
    // Market listing structure
    struct MarketListing {
        bytes32 listingId;
        address seller;
        address collection;
        uint256 tokenId;
        uint256 price;
        uint256 expiryTime;
        bool isActive;
        uint256 listedAt;
    }
    
    // State variables for marketplace
    mapping(bytes32 => MarketListing) public marketListings;
    bytes32[] public allListingIds;
    mapping(address => bytes32[]) public sellerListings;
    
    // Events
    event NFTListed(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed collection,
        uint256 tokenId,
        uint256 price,
        uint256 expiryTime
    );
    
    event NFTSold(
        bytes32 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    
    event ListingCancelled(
        bytes32 indexed listingId,
        address indexed seller
    );

    /**
     * @dev List a subscription NFT for sale in the marketplace
     * @param collection Address of the subscription collection
     * @param tokenId Token ID to list for sale
     * @param price Price in USDT (with 6 decimals)
     */
    function listSubscription(
        address collection,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(isValidCollection[collection], "Invalid collection");
        require(price > 0, "Price must be greater than 0");
        
        SubscriptionNFT nft = SubscriptionNFT(collection);
        
        // Verify ownership
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        
        // Get expiry time for display
        uint256 expiryTime = nft.getExpiryTime(tokenId);
        
        // Generate unique listing ID
        bytes32 listingId = keccak256(
            abi.encodePacked(collection, tokenId, msg.sender, block.timestamp)
        );
        
        // Create listing
        marketListings[listingId] = MarketListing({
            listingId: listingId,
            seller: msg.sender,
            collection: collection,
            tokenId: tokenId,
            price: price,
            expiryTime: expiryTime,
            isActive: true,
            listedAt: block.timestamp
        });
        
        // Track listings
        allListingIds.push(listingId);
        sellerListings[msg.sender].push(listingId);
        
        emit NFTListed(listingId, msg.sender, collection, tokenId, price, expiryTime);
    }

    /**
     * @dev Buy a subscription NFT from the marketplace
     * @param listingId ID of the listing to purchase
     */
    function buySubscription(bytes32 listingId) external nonReentrant {
        MarketListing storage listing = marketListings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.seller != msg.sender, "Cannot buy your own NFT");
        
        SubscriptionNFT nft = SubscriptionNFT(listing.collection);
        
        // Verify NFT still exists and seller still owns it
        require(nft.ownerOf(listing.tokenId) == listing.seller, "NFT no longer owned by seller");
        
        // Transfer USDT from buyer to seller (no platform fee)
        IERC20(usdtToken).transferFrom(msg.sender, listing.seller, listing.price);
        
        // Transfer NFT from seller to buyer
        nft.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        
        // Mark listing as inactive
        listing.isActive = false;
        
        emit NFTSold(listingId, msg.sender, listing.seller, listing.price);
    }

    /**
     * @dev Cancel a marketplace listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(bytes32 listingId) external {
        MarketListing storage listing = marketListings[listingId];
        require(listing.seller == msg.sender, "Not your listing");
        require(listing.isActive, "Listing not active");
        
        listing.isActive = false;
        
        emit ListingCancelled(listingId, msg.sender);
    }

    /**
     * @dev Get all active marketplace listings
     * @return activeListings Array of active listings
     */
    function getMarketListings() external view returns (MarketListing[] memory activeListings) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 0; i < allListingIds.length; i++) {
            if (marketListings[allListingIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Populate active listings
        activeListings = new MarketListing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allListingIds.length; i++) {
            bytes32 listingId = allListingIds[i];
            if (marketListings[listingId].isActive) {
                activeListings[index] = marketListings[listingId];
                index++;
            }
        }
    }

    /**
     * @dev Get listings by collection
     * @param collection Address of the subscription collection
     * @return collectionListings Array of active listings for the collection
     */
    function getListingsByCollection(address collection) 
        external 
        view 
        returns (MarketListing[] memory collectionListings) 
    {
        uint256 count = 0;
        
        // Count collection listings
        for (uint256 i = 0; i < allListingIds.length; i++) {
            MarketListing storage listing = marketListings[allListingIds[i]];
            if (listing.isActive && listing.collection == collection) {
                count++;
            }
        }
        
        // Populate collection listings
        collectionListings = new MarketListing[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allListingIds.length; i++) {
            MarketListing storage listing = marketListings[allListingIds[i]];
            if (listing.isActive && listing.collection == collection) {
                collectionListings[index] = listing;
                index++;
            }
        }
    }

    /**
     * @dev Get user's active listings
     * @param user Address of the user
     * @return userListings Array of user's active listings
     */
    function getUserListings(address user) 
        external 
        view 
        returns (MarketListing[] memory userListings) 
    {
        bytes32[] memory userListingIds = sellerListings[user];
        uint256 activeCount = 0;
        
        // Count active user listings
        for (uint256 i = 0; i < userListingIds.length; i++) {
            if (marketListings[userListingIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Populate active user listings
        userListings = new MarketListing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < userListingIds.length; i++) {
            bytes32 listingId = userListingIds[i];
            if (marketListings[listingId].isActive) {
                userListings[index] = marketListings[listingId];
                index++;
            }
        }
    }

    /**
     * @dev Reject any ETH sent to this contract
     * This prevents gas estimation errors when ETH is accidentally sent
     */
    receive() external payable {
        revert("This contract does not accept ETH");
    }

    /**
     * @dev Reject any direct calls to this contract
     */
    fallback() external payable {
        revert("Function not found");
    }
}
