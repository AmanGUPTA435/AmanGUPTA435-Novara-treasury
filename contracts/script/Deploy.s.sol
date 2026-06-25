// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "../lib/forge-std/Test.sol";
import {TestToken} from "../src/TestToken.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {TreasurySwap} from "../src/TreasurySwap.sol";

contract Deploy is Script {
    address internal constant ANVIL_0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address internal constant ANVIL_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

    function run() external {
        vm.startBroadcast();

        TestToken testToken = new TestToken(ANVIL_0);
        MockUSDC usdc = new MockUSDC(ANVIL_0);
        TreasurySwap treasury = new TreasurySwap(address(testToken), address(usdc), ANVIL_0);

        uint256 testKeep = 10_000 ether;
        uint256 usdcKeep = 1_000 * 1e6;
        uint256 usdcLiquidity = 500_000 * 1e6;

        testToken.transfer(ANVIL_1, testToken.totalSupply() - testKeep);
        usdc.transfer(address(treasury), usdcLiquidity);
        usdc.transfer(ANVIL_1, usdc.balanceOf(ANVIL_0) - usdcKeep);

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
            '"\n',
            "}\n"
        );

        vm.writeFile("src/generated/local.json", json);
    }
}
