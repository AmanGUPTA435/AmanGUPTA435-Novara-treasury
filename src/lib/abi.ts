import { erc20Abi } from "viem";

export { erc20Abi };

export const treasurySwapAbi = [
  {
    type: "function",
    name: "quote",
    stateMutability: "pure",
    inputs: [{ name: "testAmount", type: "uint256" }],
    outputs: [{ name: "usdcAmount", type: "uint256" }],
  },
  {
    type: "function",
    name: "swapTestForUsdc",
    stateMutability: "nonpayable",
    inputs: [{ name: "testAmount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "testToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "usdc",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "emergencyWithdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "SwapExecuted",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "testAmount", type: "uint256", indexed: false },
      { name: "usdcAmount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const treasuryWithdrawalAbi = [
  {
    type: "function",
    name: "createWithdrawalProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [{ name: "proposalId", type: "uint256" }],
  },

  {
    type: "function",
    name: "voteOnWithdrawalProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "bool" },
    ],
    outputs: [],
  },

  {
    type: "function",
    name: "executeWithdrawalProposal",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },

  {
    type: "function",
    name: "expireProposal",
    stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [],
  },

  {
    type: "function",
    name: "getProposal",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "approvalCount", type: "uint256" },
          { name: "rejectionCount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },

  {
    type: "function",
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address[]",
      },
    ],
  },

  {
    type: "function",
    name: "hasOwnerVoted",
    stateMutability: "view",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "owner", type: "address" },
    ],
    outputs: [
      { name: "voted", type: "bool" },
      { name: "approved", type: "bool" },
    ],
  },

  {
    type: "function",
    name: "canExecute",
    stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },

  {
    type: "function",
    name: "isOwner",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },

  {
    type: "function",
    name: "requiredApprovals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  {
    type: "function",
    name: "requiredRejections",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  {
    type: "function",
    name: "nextProposalId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  {
    type: "function",
    name: "treasuryBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  {
    type: "function",
    name: "MAX_PROPOSAL_DURATION",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  {
    type: "event",
    name: "WithdrawalProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },

  {
    type: "event",
    name: "WithdrawalProposalVoted",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "support", type: "bool", indexed: false },
      { name: "approvalCount", type: "uint256", indexed: false },
      { name: "rejectionCount", type: "uint256", indexed: false },
    ],
  },

  {
    type: "event",
    name: "WithdrawalProposalRejected",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "rejector", type: "address", indexed: true },
      { name: "rejectionCount", type: "uint256", indexed: false },
    ],
  },

  {
    type: "event",
    name: "WithdrawalProposalExecuted",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "executor", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },

  {
    type: "event",
    name: "WithdrawalProposalExpired",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "expiredAt", type: "uint256", indexed: false },
    ],
  },
] as const;
