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

The script compiles the contracts, deploys TestToken, MockUSDC, TreasurySwap, and TreasuryWithdrawalGovernance, seeds token/ETH balances, and writes addresses to src/generated/local.json for the frontend.

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

1. **Anvil Local Wallet** — uses the deterministic Anvil development accounts and supports switching between the three configured treasury owners. No browser extension is required.
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

This runs the project's Foundry tests, including the existing swap functionality and the withdrawal governance tests.

## Build

```bash
npm run build
npm run lint
```

## Treasury Withdrawal Governance

I implemented a treasury withdrawal proposal system for ETH withdrawals and integrated it into the existing Novara application.

### Architecture

The project now separates the existing token swap functionality from ETH treasury governance:

- `TreasurySwap` handles the existing TEST → USDC swap flow.
- `TreasuryWithdrawalGovernance` manages ETH withdrawal proposals, owner voting, proposal expiry, and execution.

A separate withdrawal governance contract was used instead of modifying `TreasurySwap` because the existing `TreasurySwap` contract is an ERC-20 token swap desk and does not manage ETH treasury governance. Keeping these responsibilities separate avoids coupling the two concerns while allowing both systems to be exposed through the same frontend.

The local deployment uses a 2-of-3 owner approval model.

### Withdrawal Proposal Flow

The proposal lifecycle is:

```text
Create Proposal
      ↓
Owner Approvals / Rejections
      ↓
Approval Threshold ─────────────→ Execute
      │
      ├── Rejection Threshold ─→ Rejected
      │
      └── Expiry ───────────────→ Expired
```

Each proposal contains:

- recipient address
- ETH amount
- unique proposal ID
- approval count
- rejection count
- creation timestamp
- expiry timestamp
- terminal status

Authorized owners can:

- create withdrawal proposals
- approve proposals
- reject proposals
- execute proposals once the approval threshold is reached
- finalize expired proposals

An owner can vote only once per proposal and cannot change an existing decision.

### Security

The withdrawal implementation includes:

- on-chain owner authorization for proposal creation, voting, and execution
- duplicate vote prevention
- separate approval and rejection thresholds
- bounded proposal expiry
- treasury balance checks at proposal creation and execution
- checks-effects-interactions ordering before ETH transfers
- OpenZeppelin ReentrancyGuard
- zero-address and zero-value validation
- terminal proposal states preventing replay or additional voting
- rollback handling for failed ETH transfers

### Existing Security Issue Fixed

During the review of the existing codebase, I found that `TreasurySwap.emergencyWithdraw()` inherited OpenZeppelin Ownable but did not enforce `onlyOwner`.

This allowed an unauthorized caller to invoke the function and attempt to withdraw ERC-20 balances.

I added `onlyOwner` protection and regression tests covering both authorized and unauthorized callers, including verification that an unauthorized attempt does not move any tokens.

### Testing

The Foundry test suite focuses on security and state correctness rather than increasing test count.

It covers:

- owner and authorization boundaries
- unauthorized execution
- duplicate voting
- prevention of changing an existing vote
- approval and rejection thresholds
- proposal isolation
- terminal proposal states
- proposal expiry
- treasury balance changes between proposal creation and execution
- insufficient treasury balance at execution
- failed ETH transfers and rollback behavior
- reentrancy attempts against ETH execution
- event emission
- nonexistent proposal handling
- boundary-value fuzzing for withdrawal amounts
- boundary-value fuzzing for expiry durations
- regression coverage for the TreasurySwap.emergencyWithdraw authorization issue

### Frontend Integration

The withdrawal system is integrated into the existing Next.js application using wagmi and viem.

The UI supports:

- creating withdrawal proposals
- displaying the ETH treasury balance
- viewing proposal status
- viewing approval and rejection counts
- approving or rejecting proposals
- executing eligible proposals
- finalizing expired proposals

The local Anvil wallet was extended to support switching between the three deterministic development accounts so the complete multi-owner workflow can be demonstrated directly through the application.

### Local Deployment

The withdrawal treasury is deployed separately from TreasurySwap and is funded with ETH during local deployment.

The deployment script writes the deployed contract address to:

```text
src/generated/local.json
```

The frontend consumes the generated contract address together with the withdrawal ABI defined in:

```text
src/lib/abi.ts
```

### Verification

The complete withdrawal flow was tested against the deployed local Anvil contract:

```text
Create proposal
      ↓
Owner approval
      ↓
Second owner approval
      ↓
Execute
      ↓
ETH transferred to recipient
```

The recipient balance was verified directly on the local chain after execution.

The rejection path was also tested through the frontend, with the proposal reaching its Rejected terminal state.

### Design Notes

The withdrawal proposal system is intentionally implemented as a separate contract from TreasurySwap.

TreasurySwap is responsible for the existing ERC-20 TEST → USDC swap functionality, while TreasuryWithdrawalGovernance owns the ETH treasury and its proposal lifecycle. This keeps the business logic and authorization responsibilities separated and avoids introducing ETH governance concerns into the existing token swap contract.

The proposal state machine uses explicit terminal states for Executed, Rejected, and Expired, allowing the frontend and off-chain consumers to distinguish successful execution, explicit owner disagreement, and inactivity.

Proposal expiry is owner-selected but bounded by `MAX_PROPOSAL_DURATION`, preventing proposals from remaining pending indefinitely or being created with an unreasonable lifetime.

### Running the Extended Tests

```bash
forge test -vv
```

The withdrawal governance tests cover authorization, voting, proposal lifecycle, expiry, treasury balance changes, failed ETH transfers, reentrancy, and fuzzed boundary conditions.