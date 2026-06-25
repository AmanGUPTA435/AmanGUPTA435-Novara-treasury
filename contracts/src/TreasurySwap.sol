// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TreasurySwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable testToken;
    IERC20 public immutable usdc;

    uint256 public constant RATE_NUMERATOR = 95;
    uint256 public constant RATE_DENOMINATOR = 100;

    event SwapExecuted(address indexed user, uint256 testAmount, uint256 usdcAmount);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);

    constructor(address testToken_, address usdc_, address initialOwner) Ownable(initialOwner) {
        require(testToken_ != address(0) && usdc_ != address(0), "TreasurySwap: zero token");
        testToken = IERC20(testToken_);
        usdc = IERC20(usdc_);
    }

    function quote(uint256 testAmount) public pure returns (uint256 usdcAmount) {
        usdcAmount = (testAmount * RATE_NUMERATOR * 1e6) / (RATE_DENOMINATOR * 1e18);
    }

    function swapTestForUsdc(uint256 testAmount) external nonReentrant {
        require(testAmount > 0, "TreasurySwap: zero amount");

        uint256 usdcAmount = quote(testAmount);
        require(usdcAmount > 0, "TreasurySwap: zero output");
        require(usdc.balanceOf(address(this)) >= usdcAmount, "TreasurySwap: insufficient liquidity");

        testToken.safeTransferFrom(msg.sender, address(this), testAmount);
        usdc.safeTransfer(msg.sender, usdcAmount);

        emit SwapExecuted(msg.sender, testAmount, usdcAmount);
    }

    function emergencyWithdraw(address token, uint256 amount, address to) external {
        require(token != address(0), "TreasurySwap: token");
        require(to != address(0), "TreasurySwap: recipient");
        require(amount > 0, "TreasurySwap: amount");

        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdraw(token, to, amount);
    }
}
