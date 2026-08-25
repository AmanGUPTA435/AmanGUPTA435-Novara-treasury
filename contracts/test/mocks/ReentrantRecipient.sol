// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWithdrawalGovernance {
    function executeWithdrawalProposal(uint256 proposalId) external;
}

contract ReentrantRecipient {
    IWithdrawalGovernance public treasury;
    uint256 public proposalId;

    bool public attemptedReentry;
    bool public reentryBlocked;

    function configure(address treasuryAddress, uint256 _proposalId) external {
        treasury = IWithdrawalGovernance(treasuryAddress);
        proposalId = _proposalId;
    }

    receive() external payable {
        attemptedReentry = true;

        try treasury.executeWithdrawalProposal(proposalId) {
        // Unexpected: reentrancy succeeded.
        }
        catch {
            reentryBlocked = true;
        }
    }
}
