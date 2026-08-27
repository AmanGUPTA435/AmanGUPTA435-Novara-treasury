// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {TreasuryWithdrawalGovernance} from "../src/Withdrawal.sol";
import {ReentrantRecipient} from "./mocks/ReentrantRecipient.sol";
import {RejectingRecipient} from "./mocks/RejectingRecipient.sol";

contract WithdrawalTest is Test {
    TreasuryWithdrawalGovernance treasury;

    address owner1 = address(0x1001);
    address owner2 = address(0x1002);
    address owner3 = address(0x1003);

    address nonOwner = address(0x9999);
    address recipient = address(0x2001);

    uint256 constant REQUIRED_APPROVALS = 2;
    uint256 constant INITIAL_BALANCE = 10 ether;

    function setUp() public {
        address[] memory owners = new address[](3);

        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;

        treasury = new TreasuryWithdrawalGovernance(owners, REQUIRED_APPROVALS);

        vm.deal(address(treasury), INITIAL_BALANCE);
    }

    function _approveProposal(uint256 proposalId, address owner) internal {
        vm.prank(owner);

        treasury.voteOnWithdrawalProposal(proposalId, true);
    }

    function _rejectProposal(uint256 proposalId, address owner) internal {
        vm.prank(owner);

        treasury.voteOnWithdrawalProposal(proposalId, false);
    }

    function _getProposalStatus(
        uint256 proposalId
    ) internal view returns (TreasuryWithdrawalGovernance.ProposalStatus) {
        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        return proposal.status;
    }

    function testNonOwnerCannotVote() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        vm.prank(nonOwner);

        vm.expectRevert(TreasuryWithdrawalGovernance.Unauthorized.selector);

        treasury.voteOnWithdrawalProposal(proposalId, true);
    }

    function testNonOwnerCannotExecute() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        vm.prank(nonOwner);

        vm.expectRevert(TreasuryWithdrawalGovernance.Unauthorized.selector);

        treasury.executeWithdrawalProposal(proposalId);
    }

    function testUnauthorizedExecutionLeavesStateUnchanged() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        uint256 balanceBefore = address(treasury).balance;

        vm.prank(nonOwner);

        vm.expectRevert(TreasuryWithdrawalGovernance.Unauthorized.selector);

        treasury.executeWithdrawalProposal(proposalId);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Pending)
        );

        assertEq(address(treasury).balance, balanceBefore);
    }

    function testConstructorSetsOwnersAndThresholds() public view {
        assertTrue(treasury.isOwner(owner1));
        assertTrue(treasury.isOwner(owner2));
        assertTrue(treasury.isOwner(owner3));

        address[] memory storedOwners = treasury.getOwners();

        assertEq(storedOwners.length, 3);
        assertEq(storedOwners[0], owner1);
        assertEq(storedOwners[1], owner2);
        assertEq(storedOwners[2], owner3);

        assertEq(treasury.requiredApprovals(), REQUIRED_APPROVALS);

        assertEq(treasury.requiredRejections(), 2);

        assertEq(treasury.nextProposalId(), 1);
    }

    function testConstructorRevertsWithNoOwners() public {
        address[] memory owners = new address[](0);

        vm.expectRevert(
            TreasuryWithdrawalGovernance.InvalidApprovalThreshold.selector
        );

        new TreasuryWithdrawalGovernance(owners, 1);
    }

    function testConstructorRevertsWithZeroApprovals() public {
        address[] memory owners = new address[](3);

        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;

        vm.expectRevert(
            TreasuryWithdrawalGovernance.InvalidApprovalThreshold.selector
        );

        new TreasuryWithdrawalGovernance(owners, 0);
    }

    function testConstructorRevertsWithTooManyApprovals() public {
        address[] memory owners = new address[](3);

        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;

        vm.expectRevert(
            TreasuryWithdrawalGovernance.InvalidApprovalThreshold.selector
        );

        new TreasuryWithdrawalGovernance(owners, 4);
    }

    function testConstructorRevertsWithZeroAddressOwner() public {
        address[] memory owners = new address[](2);

        owners[0] = owner1;
        owners[1] = address(0);

        vm.expectRevert(TreasuryWithdrawalGovernance.InvalidOwner.selector);

        new TreasuryWithdrawalGovernance(owners, 1);
    }

    function testConstructorRevertsWithDuplicateOwner() public {
        address[] memory owners = new address[](3);

        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner1;

        vm.expectRevert(TreasuryWithdrawalGovernance.DuplicateOwner.selector);

        new TreasuryWithdrawalGovernance(owners, 2);
    }

    function _createProposal(
        address proposalRecipient,
        uint256 amount,
        uint256 duration
    ) internal returns (uint256 proposalId) {
        vm.prank(owner1);

        proposalId = treasury.createWithdrawalProposal(
            proposalRecipient,
            amount,
            duration
        );
    }

    function testCreateWithdrawalProposal() public {
        uint256 duration = 1 days;
        uint256 amount = 2 ether;

        vm.warp(1_000);

        vm.expectEmit(true, true, true, true);

        emit TreasuryWithdrawalGovernance.WithdrawalProposalCreated(
            1,
            owner1,
            recipient,
            amount,
            block.timestamp + duration
        );

        vm.prank(owner1);

        uint256 proposalId = treasury.createWithdrawalProposal(
            recipient,
            amount,
            duration
        );

        assertEq(proposalId, 1);
        assertEq(treasury.nextProposalId(), 2);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(proposal.id, 1);
        assertEq(proposal.recipient, recipient);
        assertEq(proposal.amount, amount);
        assertEq(proposal.approvalCount, 0);
        assertEq(proposal.rejectionCount, 0);
        assertEq(proposal.createdAt, 1_000);
        assertEq(proposal.expiresAt, 1_000 + duration);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Pending)
        );
    }

    function testNonOwnerCannotCreateProposal() public {
        vm.prank(nonOwner);

        vm.expectRevert(TreasuryWithdrawalGovernance.Unauthorized.selector);

        treasury.createWithdrawalProposal(recipient, 1 ether, 1 days);
    }

    function testCreateProposalRejectsZeroRecipient() public {
        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.InvalidRecipient.selector);

        treasury.createWithdrawalProposal(address(0), 1 ether, 1 days);
    }

    function testCreateProposalRejectsZeroAmount() public {
        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.InvalidAmount.selector);

        treasury.createWithdrawalProposal(recipient, 0, 1 days);
    }

    function testCreateProposalRejectsZeroDuration() public {
        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.InvalidExpiry.selector);

        treasury.createWithdrawalProposal(recipient, 1 ether, 0);
    }

    function testCreateProposalRejectsDurationOverMaximum() public {
        uint256 max_duration = treasury.MAX_PROPOSAL_DURATION();

        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.ExpiryTooLong.selector);

        treasury.createWithdrawalProposal(recipient, 1 ether, max_duration + 1);
    }

    function testCreateProposalAcceptsMaximumDuration() public {
        uint256 duration = treasury.MAX_PROPOSAL_DURATION();

        uint256 proposalId = _createProposal(recipient, 1 ether, duration);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(proposal.expiresAt, block.timestamp + duration);
    }

    function testCreateProposalRejectsInsufficientTreasuryBalance() public {
        vm.prank(owner1);

        vm.expectRevert(
            TreasuryWithdrawalGovernance.InsufficientTreasuryBalance.selector
        );

        treasury.createWithdrawalProposal(
            recipient,
            INITIAL_BALANCE + 1,
            1 days
        );
    }

    function testOwnerCanApproveOnce() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        vm.expectEmit(true, true, false, true);

        emit TreasuryWithdrawalGovernance.WithdrawalProposalVoted(
            proposalId,
            owner1,
            true,
            1,
            0
        );

        _approveProposal(proposalId, owner1);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(proposal.approvalCount, 1);
        assertEq(proposal.rejectionCount, 0);
        assertTrue(treasury.hasVoted(proposalId, owner1));

        (, bool approved) = treasury.hasOwnerVoted(proposalId, owner1);

        assertTrue(approved);
    }

    function testOwnerCannotApproveTwice() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _approveProposal(proposalId, owner1);

        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.AlreadyVoted.selector);

        treasury.voteOnWithdrawalProposal(proposalId, true);
    }

    function testOwnerCannotChangeApprovalToRejection() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _approveProposal(proposalId, owner1);

        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.AlreadyVoted.selector);

        treasury.voteOnWithdrawalProposal(proposalId, false);
    }

    function testOwnerCanRejectOnce() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        vm.expectEmit(true, true, false, true);

        emit TreasuryWithdrawalGovernance.WithdrawalProposalVoted(
            proposalId,
            owner1,
            false,
            0,
            1
        );

        _rejectProposal(proposalId, owner1);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(proposal.approvalCount, 0);
        assertEq(proposal.rejectionCount, 1);
    }

    function testOwnerCannotChangeRejectionToApproval() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _rejectProposal(proposalId, owner1);

        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.AlreadyVoted.selector);

        treasury.voteOnWithdrawalProposal(proposalId, true);
    }

    function testVotingStateIsIsolatedPerProposal() public {
        uint256 proposalA = _createProposal(recipient, 1 ether, 1 days);

        uint256 proposalB;

        vm.prank(owner1);

        proposalB = treasury.createWithdrawalProposal(
            recipient,
            2 ether,
            1 days
        );

        _approveProposal(proposalA, owner1);

        TreasuryWithdrawalGovernance.WithdrawalProposal memory a = treasury
            .getProposal(proposalA);

        TreasuryWithdrawalGovernance.WithdrawalProposal memory b = treasury
            .getProposal(proposalB);

        assertEq(a.approvalCount, 1);
        assertEq(b.approvalCount, 0);

        assertTrue(treasury.hasVoted(proposalA, owner1));
        assertTrue(!treasury.hasVoted(proposalB, owner1));
    }

    function testProposalBecomesExecutableAtApprovalThreshold() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _approveProposal(proposalId, owner1);
        _approveProposal(proposalId, owner2);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(proposal.approvalCount, 2);
        assertTrue(treasury.canExecute(proposalId));
    }

    function testProposalBecomesRejectedAtRejectionThreshold() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _rejectProposal(proposalId, owner1);

        vm.expectEmit(true, true, false, true);

        emit TreasuryWithdrawalGovernance.WithdrawalProposalRejected(
            proposalId,
            owner2,
            2
        );

        _rejectProposal(proposalId, owner2);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Rejected)
        );
    }

    function testRejectedProposalCannotExecute() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _rejectProposal(proposalId, owner1);
        _rejectProposal(proposalId, owner2);

        vm.prank(owner3);

        vm.expectRevert(
            TreasuryWithdrawalGovernance.ProposalAlreadyRejected.selector
        );

        treasury.executeWithdrawalProposal(proposalId);
    }

    function testSuccessfulExecutionTransfersEthAndMarksExecuted() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _approveProposal(proposalId, owner1);
        _approveProposal(proposalId, owner2);

        uint256 treasuryBefore = address(treasury).balance;

        uint256 recipientBefore = recipient.balance;

        vm.expectEmit(true, true, true, true);

        emit TreasuryWithdrawalGovernance.WithdrawalProposalExecuted(
            proposalId,
            owner1,
            recipient,
            1 ether
        );

        vm.prank(owner1);

        treasury.executeWithdrawalProposal(proposalId);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Executed)
        );

        assertEq(address(treasury).balance, treasuryBefore - 1 ether);

        assertEq(recipient.balance, recipientBefore + 1 ether);
    }

    function testExecutedProposalCannotExecuteAgain() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _approveProposal(proposalId, owner1);
        _approveProposal(proposalId, owner2);

        vm.prank(owner1);
        treasury.executeWithdrawalProposal(proposalId);

        vm.prank(owner2);

        vm.expectRevert(
            TreasuryWithdrawalGovernance.ProposalAlreadyExecuted.selector
        );

        treasury.executeWithdrawalProposal(proposalId);
    }

    function testProposalCanBeVotedBeforeExpiry() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        vm.warp(proposal.expiresAt - 1);

        _approveProposal(proposalId, owner1);

        proposal = treasury.getProposal(proposalId);

        assertEq(proposal.approvalCount, 1);
    }

    function testVotingAtExpiryReverts() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        vm.warp(proposal.expiresAt);

        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.ProposalExpired.selector);

        treasury.voteOnWithdrawalProposal(proposalId, true);
    }

    function testExecutionAtExpiryReverts() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        _approveProposal(proposalId, owner1);
        _approveProposal(proposalId, owner2);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        vm.warp(proposal.expiresAt);

        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.ProposalExpired.selector);

        treasury.executeWithdrawalProposal(proposalId);
    }

    function testExpireProposalPersistsExpiredState() public {
        uint256 proposalId = _createProposal(recipient, 1 ether, 1 days);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        vm.warp(proposal.expiresAt);

        vm.expectEmit(true, false, false, true);

        emit TreasuryWithdrawalGovernance.WithdrawalProposalExpired(
            proposalId,
            proposal.expiresAt
        );

        treasury.expireProposal(proposalId);

        proposal = treasury.getProposal(proposalId);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Expired)
        );
    }

    function testExecutionRechecksTreasuryBalance() public {
        uint256 proposalA = _createProposal(recipient, 6 ether, 1 days);

        uint256 proposalB;

        vm.prank(owner1);

        proposalB = treasury.createWithdrawalProposal(
            recipient,
            6 ether,
            1 days
        );

        _approveProposal(proposalA, owner1);
        _approveProposal(proposalA, owner2);

        vm.prank(owner1);

        treasury.executeWithdrawalProposal(proposalA);

        assertEq(address(treasury).balance, 4 ether);

        _approveProposal(proposalB, owner2);
        _approveProposal(proposalB, owner3);

        vm.prank(owner2);

        vm.expectRevert(
            TreasuryWithdrawalGovernance.InsufficientTreasuryBalance.selector
        );

        treasury.executeWithdrawalProposal(proposalB);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalB);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Pending)
        );

        assertEq(address(treasury).balance, 4 ether);
    }

    function testReentrancyCannotExecuteProposalTwice() public {
        ReentrantRecipient attacker = new ReentrantRecipient();

        address[] memory owners = new address[](3);

        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = address(attacker);

        TreasuryWithdrawalGovernance guardedTreasury = new TreasuryWithdrawalGovernance(
                owners,
                2
            );

        vm.deal(address(guardedTreasury), 5 ether);

        vm.prank(owner1);

        uint256 proposalId = guardedTreasury.createWithdrawalProposal(
            address(attacker),
            1 ether,
            1 days
        );

        vm.prank(owner1);

        guardedTreasury.voteOnWithdrawalProposal(proposalId, true);

        vm.prank(owner2);

        guardedTreasury.voteOnWithdrawalProposal(proposalId, true);

        attacker.configure(address(guardedTreasury), proposalId);

        uint256 treasuryBefore = address(guardedTreasury).balance;

        vm.prank(owner1);

        guardedTreasury.executeWithdrawalProposal(proposalId);

        assertTrue(attacker.attemptedReentry());
        assertTrue(attacker.reentryBlocked());

        assertEq(address(guardedTreasury).balance, treasuryBefore - 1 ether);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = guardedTreasury.getProposal(proposalId);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Executed)
        );
    }

    function testNonexistentProposalCannotBeVotedOn() public {
        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.ProposalNotFound.selector);

        treasury.voteOnWithdrawalProposal(999, true);
    }

    function testEthTransferFailureRollsBackExecution() public {
        RejectingRecipient rejectingRecipient = new RejectingRecipient();

        uint256 proposalId = _createProposal(
            address(rejectingRecipient),
            1 ether,
            1 days
        );

        _approveProposal(proposalId, owner1);
        _approveProposal(proposalId, owner2);

        uint256 treasuryBefore = address(treasury).balance;

        vm.prank(owner1);

        vm.expectRevert(TreasuryWithdrawalGovernance.TransferFailed.selector);

        treasury.executeWithdrawalProposal(proposalId);

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(
            uint256(proposal.status),
            uint256(TreasuryWithdrawalGovernance.ProposalStatus.Pending)
        );

        assertEq(address(treasury).balance, treasuryBefore);

        assertEq(address(rejectingRecipient).balance, 0);
    }

    function testFuzz_CreateProposalAmount(uint256 amount) public {
        if (amount == 0) {
            vm.prank(owner1);

            vm.expectRevert(
                TreasuryWithdrawalGovernance.InvalidAmount.selector
            );

            treasury.createWithdrawalProposal(recipient, amount, 1 days);

            return;
        }

        if (amount > INITIAL_BALANCE) {
            vm.prank(owner1);

            vm.expectRevert(
                TreasuryWithdrawalGovernance
                    .InsufficientTreasuryBalance
                    .selector
            );

            treasury.createWithdrawalProposal(recipient, amount, 1 days);

            return;
        }

        vm.prank(owner1);

        uint256 proposalId = treasury.createWithdrawalProposal(
            recipient,
            amount,
            1 days
        );

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(proposal.amount, amount);
    }

    function testFuzz_CreateProposalDuration(uint256 duration) public {
        if (duration == 0) {
            vm.prank(owner1);

            vm.expectRevert(
                TreasuryWithdrawalGovernance.InvalidExpiry.selector
            );

            treasury.createWithdrawalProposal(recipient, 1 ether, duration);

            return;
        }

        if (duration > treasury.MAX_PROPOSAL_DURATION()) {
            vm.prank(owner1);

            vm.expectRevert(
                TreasuryWithdrawalGovernance.ExpiryTooLong.selector
            );

            treasury.createWithdrawalProposal(recipient, 1 ether, duration);

            return;
        }

        uint256 createdAt = block.timestamp;

        vm.prank(owner1);

        uint256 proposalId = treasury.createWithdrawalProposal(
            recipient,
            1 ether,
            duration
        );

        TreasuryWithdrawalGovernance.WithdrawalProposal
            memory proposal = treasury.getProposal(proposalId);

        assertEq(proposal.createdAt, createdAt);
        assertEq(proposal.expiresAt, createdAt + duration);
    }
}
