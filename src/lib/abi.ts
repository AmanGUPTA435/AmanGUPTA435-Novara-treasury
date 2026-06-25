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
