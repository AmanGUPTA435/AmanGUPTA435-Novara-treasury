export const ANVIL_CHAIN_ID = 31337;
export const ANVIL_RPC_URL = "http://127.0.0.1:8545";
export const ANVIL_ACCOUNTS = [
  {
    address:
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const,
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const,
  },
  {
    address:
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const,
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as const,
  },
  {
    address:
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as const,
    privateKey:
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as const,
  },
] as const;

export const ANVIL_ACCOUNT_0 = ANVIL_ACCOUNTS[0].address;
export const ANVIL_ACCOUNT_1 = ANVIL_ACCOUNTS[1].address;
export const ANVIL_ACCOUNT_2 = ANVIL_ACCOUNTS[2].address;

export const ANVIL_PRIVATE_KEY = ANVIL_ACCOUNTS[0].privateKey;
export const ANVIL_PRIVATE_KEY_1 = ANVIL_ACCOUNTS[1].privateKey;
export const ANVIL_PRIVATE_KEY_2 = ANVIL_ACCOUNTS[2].privateKey;

export const EXCHANGE_RATE = 0.95;
export const MIN_RECEIVED_BPS = 50;

export const SETTLEMENT_DECIMALS = 6;
export const TEST_DISPLAY_DECIMALS = 18;
export const USDC_DISPLAY_DECIMALS = 6;
