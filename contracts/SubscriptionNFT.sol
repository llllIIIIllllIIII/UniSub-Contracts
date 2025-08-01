// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SubscriptionNFT
 * @dev NFT contract representing time-bound subscription credentials
 * Each NFT represents a subscription that expires after a set duration
 */
contract SubscriptionNFT is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Immutable contract configuration
    IERC20 public immutable usdtToken;
    uint256 public immutable price;
    uint256 public immutable duration;
    
    // State variables
    uint256 private _tokenIdCounter;
    
    // Mappings for subscription data
    mapping(uint256 => uint256) public expiryTimes;
    mapping(address => uint256[]) public userTokens;
    
    // Events
    event SubscriptionMinted(
        address indexed user, 
        uint256 indexed tokenId, 
        uint256 expiryTime
    );
    
    event SubscriptionRenewed(
        uint256 indexed tokenId, 
        uint256 newExpiryTime
    );

    /**
     * @dev Constructor to initialize the subscription NFT collection
     * @param name Name of the subscription service
     * @param symbol Symbol for the NFT collection
     * @param _usdtToken Address of the USDT token contract
     * @param _price Price in USDT (with 6 decimals)
     * @param _duration Subscription duration in seconds
     * @param _serviceProvider Address of the service provider (owner)
     */
    constructor(
        string memory name,
        string memory symbol,
        address _usdtToken,
        uint256 _price,
        uint256 _duration,
        address _serviceProvider
    ) ERC721(name, symbol) Ownable(_serviceProvider) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_price > 0, "Price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_serviceProvider != address(0), "Invalid service provider address");
        
        usdtToken = IERC20(_usdtToken);
        price = _price;
        duration = _duration;
    }

    /**
     * @dev Mint a new subscription NFT
     * User must have approved sufficient USDT before calling this function
     */
    function mintSubscription() external nonReentrant {
        // Transfer USDT from user to service provider
        usdtToken.safeTransferFrom(msg.sender, owner(), price);
        
        // Generate new token ID
        uint256 tokenId = _tokenIdCounter++;
        
        // Mint NFT to user
        _safeMint(msg.sender, tokenId);
        
        // Calculate and store expiry time
        uint256 expiryTime = block.timestamp + duration;
        expiryTimes[tokenId] = expiryTime;
        
        // Track user's tokens
        userTokens[msg.sender].push(tokenId);
        
        emit SubscriptionMinted(msg.sender, tokenId, expiryTime);
    }

    /**
     * @dev Check if a user has a valid (non-expired) subscription
     * @param user Address to check for valid subscription
     * @return bool True if user has at least one valid subscription
     */
    function hasValidSubscription(address user) external view returns (bool) {
        uint256[] memory tokens = userTokens[user];
        
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenId = tokens[i];
            
            // Check if user still owns the token and it's not expired
            if (_ownerOf(tokenId) == user && 
                block.timestamp < expiryTimes[tokenId]) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @dev Get expiry time for a specific token
     * @param tokenId Token ID to query
     * @return uint256 Expiry timestamp
     */
    function getExpiryTime(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return expiryTimes[tokenId];
    }

    /**
     * @dev Get all token IDs owned by a user
     * @param user Address to query
     * @return uint256[] Array of token IDs
     */
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }

    /**
     * @dev Get user's valid (non-expired) subscriptions with expiry times
     * @param user Address to query
     * @return tokenIds Array of valid token IDs
     * @return expiryTimestamps Array of corresponding expiry times
     */
    function getUserValidSubscriptions(address user) 
        external 
        view 
        returns (uint256[] memory tokenIds, uint256[] memory expiryTimestamps) 
    {
        uint256[] memory allTokens = userTokens[user];
        uint256 validCount = 0;
        
        // First pass: count valid subscriptions
        for (uint256 i = 0; i < allTokens.length; i++) {
            uint256 tokenId = allTokens[i];
            if (_ownerOf(tokenId) == user && 
                block.timestamp < expiryTimes[tokenId]) {
                validCount++;
            }
        }
        
        // Second pass: populate arrays
        tokenIds = new uint256[](validCount);
        expiryTimestamps = new uint256[](validCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            uint256 tokenId = allTokens[i];
            if (_ownerOf(tokenId) == user && 
                block.timestamp < expiryTimes[tokenId]) {
                tokenIds[index] = tokenId;
                expiryTimestamps[index] = expiryTimes[tokenId];
                index++;
            }
        }
    }

    /**
     * @dev Renew an existing subscription (extends expiry time)
     * @param tokenId Token ID to renew
     */
    function renewSubscription(uint256 tokenId) external nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        // Transfer USDT from user to service provider
        usdtToken.safeTransferFrom(msg.sender, owner(), price);
        
        // Extend expiry time
        uint256 currentExpiry = expiryTimes[tokenId];
        uint256 newExpiry;
        
        // If subscription is still valid, extend from current expiry
        // If expired, extend from current timestamp
        if (block.timestamp < currentExpiry) {
            newExpiry = currentExpiry + duration;
        } else {
            newExpiry = block.timestamp + duration;
        }
        
        expiryTimes[tokenId] = newExpiry;
        
        emit SubscriptionRenewed(tokenId, newExpiry);
    }

    /**
     * @dev Check if a subscription is expired
     * @param tokenId Token ID to check
     * @return bool True if subscription is expired
     */
    function isExpired(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return block.timestamp >= expiryTimes[tokenId];
    }

    /**
     * @dev Override _update to track token transfers
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Call parent implementation first
        address result = super._update(to, tokenId, auth);
        
        // Update user token tracking when transferring (not minting/burning)
        if (from != address(0) && to != address(0)) {
            // Remove from sender's list
            _removeTokenFromUser(from, tokenId);
            // Add to receiver's list
            userTokens[to].push(tokenId);
        }
        
        return result;
    }

    /**
     * @dev Remove token from user's token list
     * @param user User address
     * @param tokenId Token ID to remove
     */
    function _removeTokenFromUser(address user, uint256 tokenId) private {
        uint256[] storage tokens = userTokens[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Generate token URI with dynamic metadata
     * @param tokenId Token ID
     * @return string Token URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        // For now, return a simple URI
        // In production, this could generate dynamic metadata based on expiry status
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 
            ? string(abi.encodePacked(baseURI, Strings.toString(tokenId)))
            : "";
    }

    /**
     * @dev Get contract information
     * @return serviceName Name of the service
     * @return subscriptionPrice Price in USDT
     * @return subscriptionDuration Duration in seconds
     * @return totalSupply Total number of tokens minted
     */
    function getContractInfo() 
        external 
        view 
        returns (
            string memory serviceName,
            uint256 subscriptionPrice,
            uint256 subscriptionDuration,
            uint256 totalSupply
        ) 
    {
        return (name(), price, duration, _tokenIdCounter);
    }
}
