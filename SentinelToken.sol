// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SentinelToken
 * @dev An AI-Utility token that burns supply upon service usage.
 */
contract SentinelToken is ERC20, Ownable, Pausable {
    
    // The cost in SNTL tokens to trigger one AI Audit
    uint256 public auditPrice = 10 * 10**18; 

    // Events allow your Python Bridge to "hear" what happens on the blockchain
    event AuditPaid(address indexed user, uint256 amount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor() ERC20("Sentinel AI", "SNTL") Ownable(msg.sender) {
        // Mint 1,000,000 tokens to the deployer (you)
        _mint(msg.sender, 1000000 * 10**18);
    }

    /**
     * @notice Users call this to pay for an AI audit.
     * @dev Burns tokens from the caller's balance to create deflationary pressure.
     */
    function payForAudit() external whenNotPaused {
        require(balanceOf(msg.sender) >= auditPrice, "Sentinel: Insufficient balance for audit");
        
        _burn(msg.sender, auditPrice);
        
        emit AuditPaid(msg.sender, auditPrice);
    }

    /**
     * @dev Allows the owner to adjust the audit price if token value fluctuates.
     */
    function setAuditPrice(uint256 _newPrice) external onlyOwner {
        uint256 oldPrice = auditPrice;
        auditPrice = _newPrice;
        emit PriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @dev Emergency stop for the audit service (e.g., server maintenance).
     */
    function pauseService() external onlyOwner {
        _pause();
    }

    function unpauseService() external onlyOwner {
        _unpause();
    }
}
