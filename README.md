# Novara Treasury

Local token swap desk for converting TEST into USDC on a private Anvil chain.

The application shows wallet balances, submits TEST approvals, executes a fixed-rate swap, and tracks recent local transaction activity.

## Requirements

- Node.js 18.18 or newer
- npm
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge` and `anvil` available on your `PATH`)

No hosted RPC keys, WalletConnect project IDs, or cloud services are required. After dependencies are installed, the stack runs offline.

## Installation

```bash
npm install
```

If Foundry is installed in the default location (`~/.foundry/bin`), the project scripts add that directory to `PATH` automatically.

## Running Anvil

```bash
npm run chain
```

This starts Anvil at `http://127.0.0.1:8545` with chain ID `31337` and 10 ETH on each deterministic test account.

## Deploying contracts

With Anvil running:

```bash
npm run deploy
```

The script compiles the contracts, deploys TestToken, MockUSDC, and TreasurySwap, seeds balances, and writes addresses to `src/generated/local.json` for the frontend.

Seeded first Anvil account:

- 10,000 TEST
- 1,000 USDC
- 10 ETH

The swap contract is funded with USDC inventory.

## Starting the frontend

All-in-one (starts Anvil if needed, deploys, then serves Next.js):

```bash
npm run dev
```

Frontend only, if the chain is already deployed:

```bash
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000).

## Connecting a local wallet

The header Connect button offers:

1. **Anvil Local Wallet** — uses Anvil account #0 on this machine. No browser extension is required.
2. **Browser Wallet** — MetaMask or another injected wallet.

For a browser wallet, add a network:

- Network name: Anvil Local
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency: ETH

Import Anvil account #0 (development key, never use on a public network):

```
Address:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Tests

```bash
npm test
```

This runs the Foundry suite for deployment, token balances, quotes, swaps, and events.

## Build

```bash
npm run build
npm run lint
```
