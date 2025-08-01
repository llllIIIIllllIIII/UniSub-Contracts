// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing purposes
 * Simulates USDT with 6 decimal places
 */
contract MockUSDT is ERC20, Ownable {
    
    uint8 private _decimals = 6;
    
    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {
        // Mint initial supply to deployer (1 million USDT)
        _mint(msg.sender, 1_000_000 * 10**_decimals);
    }
    
    /**
     * @dev Override decimals to match real USDT (6 decimals)
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mint tokens for testing (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in USDT units, considering 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Faucet function for testing - anyone can claim 1000 USDT
     * @param to Address to send tokens to
     */
    function faucet(address to) external {
        require(to != address(0), "Invalid address");
        _mint(to, 1000 * 10**_decimals); // 1000 USDT
    }
    
    /**
     * @dev Burn tokens (only owner)
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
