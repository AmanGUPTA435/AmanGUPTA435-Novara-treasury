// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TreasuryWithdrawalGovernance is ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error Unauthorized();
    error InvalidOwner();
    error DuplicateOwner();
    error InvalidApprovalThreshold();

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidExpiry();
    error ProposalNotExpired();
    error ExpiryTooLong();

    error ProposalNotFound();
    error ProposalAlreadyExecuted();
    error ProposalAlreadyRejected();
    error ProposalExpired();

    error AlreadyVoted();
    error ApprovalThresholdNotReached();
    error InsufficientTreasuryBalance();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event WithdrawalProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed recipient,
        uint256 amount,
        uint256 expiresAt
    );

    // support = true  -> approval
    // support = false -> rejection
    event WithdrawalProposalVoted(
        uint256 indexed proposalId,
        address indexed owner,
        bool support,
        uint256 approvalCount,
        uint256 rejectionCount
    );

    event WithdrawalProposalExecuted(
        uint256 indexed proposalId,
        address indexed executor,
        address indexed recipient,
        uint256 amount
    );

    event WithdrawalProposalRejected(
        uint256 indexed proposalId,
        address indexed rejector,
        uint256 rejectionCount
    );

    event WithdrawalProposalExpired(
        uint256 indexed proposalId,
        uint256 expiredAt
    );

    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    enum ProposalStatus {
        Pending,
        Executed,
        Rejected,
        Expired
    }

    struct WithdrawalProposal {
        uint256 id;
        address recipient;
        uint256 amount;
        uint256 approvalCount;
        uint256 rejectionCount;
        uint256 createdAt;
        uint256 expiresAt;
        ProposalStatus status;
    }

    /*//////////////////////////////////////////////////////////////
                                STATE
    //////////////////////////////////////////////////////////////*/

    mapping(address => bool) public isOwner;
    address[] public owners;

    uint256 public immutable requiredApprovals;
    uint256 public immutable requiredRejections;

    uint256 public nextProposalId = 1;

    // Hard maximum for owner-selected proposal lifetime.
    uint256 public constant MAX_PROPOSAL_DURATION = 30 days;

    mapping(uint256 => WithdrawalProposal) public proposals;

    mapping(uint256 => mapping(address => bool)) public hasVoted;

    mapping(uint256 => mapping(address => bool)) public approvedVote;

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address[] memory _owners, uint256 _requiredApprovals) {
        if (_owners.length == 0) {
            revert InvalidApprovalThreshold();
        }

        if (_requiredApprovals == 0 || _requiredApprovals > _owners.length) {
            revert InvalidApprovalThreshold();
        }

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            if (owner == address(0)) {
                revert InvalidOwner();
            }

            if (isOwner[owner]) {
                revert DuplicateOwner();
            }

            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredApprovals = _requiredApprovals;

        // Prevents a proposal from reaching both approval and rejection
        // thresholds with the same set of votes.
        requiredRejections = _owners.length - _requiredApprovals + 1;
    }

    /*//////////////////////////////////////////////////////////////
                            TREASURY FUNDING
    //////////////////////////////////////////////////////////////*/

    receive() external payable {}

    /*//////////////////////////////////////////////////////////////
                       CREATE WITHDRAWAL PROPOSAL
    //////////////////////////////////////////////////////////////*/

    function createWithdrawalProposal(
        address recipient,
        uint256 amount,
        uint256 duration
    ) external onlyOwner returns (uint256 proposalId) {
        if (recipient == address(0)) {
            revert InvalidRecipient();
        }

        if (amount == 0) {
            revert InvalidAmount();
        }

        if (duration == 0) {
            revert InvalidExpiry();
        }

        if (duration > MAX_PROPOSAL_DURATION) {
            revert ExpiryTooLong();
        }

        if (address(this).balance < amount) {
            revert InsufficientTreasuryBalance();
        }

        proposalId = nextProposalId++;

        uint256 expiresAt = block.timestamp + duration;

        proposals[proposalId] = WithdrawalProposal({
            id: proposalId,
            recipient: recipient,
            amount: amount,
            approvalCount: 0,
            rejectionCount: 0,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: ProposalStatus.Pending
        });

        emit WithdrawalProposalCreated(
            proposalId,
            msg.sender,
            recipient,
            amount,
            expiresAt
        );
    }

    /*//////////////////////////////////////////////////////////////
                              VOTING
    //////////////////////////////////////////////////////////////*/

    function voteOnWithdrawalProposal(
        uint256 proposalId,
        bool support
    ) external onlyOwner {
        WithdrawalProposal storage proposal = proposals[proposalId];

        if (proposalId == 0 || proposal.id != proposalId) {
            revert ProposalNotFound();
        }

        if (proposal.status == ProposalStatus.Executed) {
            revert ProposalAlreadyExecuted();
        }

        if (proposal.status == ProposalStatus.Rejected) {
            revert ProposalAlreadyRejected();
        }

        // Expired proposals cannot receive additional votes.
        // Call expireProposal() to finalize the expired state.

        if (block.timestamp >= proposal.expiresAt) {
            revert ProposalExpired();
        }

        if (hasVoted[proposalId][msg.sender]) {
            revert AlreadyVoted();
        }

        hasVoted[proposalId][msg.sender] = true;
        approvedVote[proposalId][msg.sender] = support;

        if (support) {
            proposal.approvalCount++;
        } else {
            proposal.rejectionCount++;
        }

        emit WithdrawalProposalVoted(
            proposalId,
            msg.sender,
            support,
            proposal.approvalCount,
            proposal.rejectionCount
        );

        // A rejection threshold terminates the proposal.
        if (proposal.rejectionCount >= requiredRejections) {
            proposal.status = ProposalStatus.Rejected;

            emit WithdrawalProposalRejected(
                proposalId,
                msg.sender,
                proposal.rejectionCount
            );
        }
    }

    /*//////////////////////////////////////////////////////////////
                              EXECUTION
    //////////////////////////////////////////////////////////////*/

    function executeWithdrawalProposal(
        uint256 proposalId
    ) external onlyOwner nonReentrant {
        WithdrawalProposal storage proposal = proposals[proposalId];

        if (proposalId == 0 || proposal.id != proposalId) {
            revert ProposalNotFound();
        }

        if (proposal.status == ProposalStatus.Executed) {
            revert ProposalAlreadyExecuted();
        }

        if (proposal.status == ProposalStatus.Rejected) {
            revert ProposalAlreadyRejected();
        }

        if (proposal.status == ProposalStatus.Expired) {
            revert ProposalExpired();
        }

        if (block.timestamp >= proposal.expiresAt) {
            revert ProposalExpired();
        }

        if (proposal.approvalCount < requiredApprovals) {
            revert ApprovalThresholdNotReached();
        }

        // Check again during execution because the treasury balance
        // can change after the proposal is created.
        if (address(this).balance < proposal.amount) {
            revert InsufficientTreasuryBalance();
        }

        // Mark as executed before transferring ETH so a malicious
        // recipient cannot re-enter and execute the same proposal.
        proposal.status = ProposalStatus.Executed;

        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");

        if (!success) {
            revert TransferFailed();
        }

        emit WithdrawalProposalExecuted(
            proposalId,
            msg.sender,
            proposal.recipient,
            proposal.amount
        );
    }

    /*//////////////////////////////////////////////////////////////
                              EXPIRATION
    //////////////////////////////////////////////////////////////*/

    // Anyone can finalize an expired proposal since this only changes
    // proposal state and does not move funds.
    function expireProposal(uint256 proposalId) external {
        WithdrawalProposal storage proposal = proposals[proposalId];

        if (proposal.status != ProposalStatus.Pending) {
            return;
        }

        if (block.timestamp < proposal.expiresAt) {
            revert ProposalNotExpired();
        }

        proposal.status = ProposalStatus.Expired;

        emit WithdrawalProposalExpired(proposalId, proposal.expiresAt);
    }

    /*//////////////////////////////////////////////////////////////
                                VIEWS
    //////////////////////////////////////////////////////////////*/

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getProposal(
        uint256 proposalId
    ) external view returns (WithdrawalProposal memory) {
        WithdrawalProposal storage proposal = proposals[proposalId];

        if (proposalId == 0 || proposal.id != proposalId) {
            revert ProposalNotFound();
        }

        return proposal;
    }

    function canExecute(uint256 proposalId) external view returns (bool) {
        WithdrawalProposal storage proposal = proposals[proposalId];

        if (proposalId == 0 || proposal.id != proposalId) {
            revert ProposalNotFound();
        }

        if (proposal.status != ProposalStatus.Pending) {
            return false;
        }

        if (block.timestamp >= proposal.expiresAt) {
            return false;
        }

        if (proposal.approvalCount < requiredApprovals) {
            return false;
        }

        return address(this).balance >= proposal.amount;
    }

    function hasOwnerVoted(
        uint256 proposalId,
        address owner
    ) external view returns (bool voted, bool approved) {
        voted = hasVoted[proposalId][owner];
        approved = approvedVote[proposalId][owner];
    }

    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
