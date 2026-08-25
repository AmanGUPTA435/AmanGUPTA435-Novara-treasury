// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "../lib/forge-std/Test.sol";
import {TestToken} from "../src/TestToken.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {TreasurySwap} from "../src/TreasurySwap.sol";
import {TreasuryWithdrawalGovernance} from "../src/Withdrawal.sol";

contract Deploy is Script {
    address internal constant ANVIL_0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    address internal constant ANVIL_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    address internal constant ANVIL_2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    uint256 internal constant WITHDRAWAL_TREASURY_ETH = 10 ether;

    function run() external {
        vm.startBroadcast();

        TestToken testToken = new TestToken(ANVIL_0);
        MockUSDC usdc = new MockUSDC(ANVIL_0);

        TreasurySwap treasury = new TreasurySwap(address(testToken), address(usdc), ANVIL_0);

        address[] memory withdrawalOwners = new address[](3);
        withdrawalOwners[0] = ANVIL_0;
        withdrawalOwners[1] = ANVIL_1;
        withdrawalOwners[2] = ANVIL_2;

        TreasuryWithdrawalGovernance withdrawal = new TreasuryWithdrawalGovernance(withdrawalOwners, 2);

        uint256 testKeep = 10_000 ether;
        uint256 usdcKeep = 1_000 * 1e6;
        uint256 usdcLiquidity = 500_000 * 1e6;

        testToken.transfer(ANVIL_1, testToken.totalSupply() - testKeep);

        usdc.transfer(address(treasury), usdcLiquidity);

        usdc.transfer(ANVIL_1, usdc.balanceOf(ANVIL_0) - usdcKeep);

        // Fund the ETH withdrawal treasury.
        payable(address(withdrawal)).transfer(WITHDRAWAL_TREASURY_ETH);

        vm.stopBroadcast();

        string memory json = string.concat(
            "{\n",
            '  "chainId": 31337,\n',
            '  "testToken": "',
            vm.toString(address(testToken)),
            '",\n',
            '  "mockUsdc": "',
            vm.toString(address(usdc)),
            '",\n',
            '  "treasurySwap": "',
            vm.toString(address(treasury)),
            '",\n',
            '  "treasuryWithdrawal": "',
            vm.toString(address(withdrawal)),
            '"\n',
            "}\n"
        );

        vm.writeFile("src/generated/local.json", json);
    }
}
