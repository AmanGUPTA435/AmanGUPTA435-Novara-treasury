// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "../lib/forge-std/Test.sol";
import {TestToken} from "../src/TestToken.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {TreasurySwap} from "../src/TreasurySwap.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TreasurySwapTest is Test {
    address internal owner = address(0xA11CE);
    address internal user = address(0xB0B);
    address internal other = address(0xC0FFEE);

    TestToken internal testToken;
    MockUSDC internal usdc;
    TreasurySwap internal treasury;

    event SwapExecuted(address indexed user, uint256 testAmount, uint256 usdcAmount);

    function setUp() public {
        testToken = new TestToken(owner);
        usdc = new MockUSDC(owner);
        treasury = new TreasurySwap(address(testToken), address(usdc), owner);

        vm.startPrank(owner);
        testToken.transfer(user, 10_000 ether);
        usdc.transfer(user, 1_000 * 1e6);
        usdc.transfer(address(treasury), 500_000 * 1e6);
        vm.stopPrank();
    }

    function test_deployment_sets_tokens_and_owner() public view {
        assertEq(address(treasury.testToken()), address(testToken));
        assertEq(address(treasury.usdc()), address(usdc));
        assertEq(treasury.owner(), owner);
    }

    function test_token_metadata_and_supply() public view {
        assertEq(testToken.name(), "Test Token");
        assertEq(testToken.symbol(), "TEST");
        assertEq(uint256(testToken.decimals()), 18);
        assertEq(testToken.totalSupply(), 1_000_000 ether);

        assertEq(usdc.name(), "USD Coin");
        assertEq(usdc.symbol(), "USDC");
        assertEq(uint256(usdc.decimals()), 6);
        assertEq(usdc.totalSupply(), 1_000_000 * 1e6);
    }

    function test_seeded_balances() public view {
        assertEq(testToken.balanceOf(user), 10_000 ether);
        assertEq(usdc.balanceOf(user), 1_000 * 1e6);
        assertEq(usdc.balanceOf(address(treasury)), 500_000 * 1e6);
    }

    function test_quote_one_test_token() public view {
        assertEq(treasury.quote(1 ether), 950_000);
    }

    function test_quote_ten_test_tokens() public view {
        assertEq(treasury.quote(10 ether), 9_500_000);
    }

    function test_quote_zero() public view {
        assertEq(treasury.quote(0), 0);
    }

    function test_swap_moves_balances() public {
        uint256 amountIn = 100 ether;
        uint256 expectedOut = treasury.quote(amountIn);

        vm.startPrank(user);
        testToken.approve(address(treasury), amountIn);
        treasury.swapTestForUsdc(amountIn);
        vm.stopPrank();

        assertEq(testToken.balanceOf(user), 10_000 ether - amountIn);
        assertEq(usdc.balanceOf(user), 1_000 * 1e6 + expectedOut);
        assertEq(testToken.balanceOf(address(treasury)), amountIn);
        assertEq(usdc.balanceOf(address(treasury)), 500_000 * 1e6 - expectedOut);
    }

    function test_swap_emits_event() public {
        uint256 amountIn = 25 ether;
        uint256 expectedOut = treasury.quote(amountIn);

        vm.startPrank(user);
        testToken.approve(address(treasury), amountIn);

        vm.expectEmit(true, false, false, true);
        emit SwapExecuted(user, amountIn, expectedOut);
        treasury.swapTestForUsdc(amountIn);
        vm.stopPrank();
    }

    function test_swap_reverts_without_allowance() public {
        vm.prank(user);
        vm.expectRevert();
        treasury.swapTestForUsdc(1 ether);
    }

    function test_swap_reverts_on_zero_amount() public {
        vm.prank(user);
        vm.expectRevert(bytes("TreasurySwap: zero amount"));
        treasury.swapTestForUsdc(0);
    }

    function test_owner_can_emergency_withdraw() public {
        uint256 amount = 1_000 * 1e6;
        uint256 beforeBal = usdc.balanceOf(owner);

        vm.prank(owner);
        treasury.emergencyWithdraw(address(usdc), amount, owner);

        assertEq(usdc.balanceOf(owner), beforeBal + amount);
    }
}
