"use client";

import { Clock3, ShieldCheck, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import {
  formatEther,
  isAddress,
  parseEther,
  type Address,
} from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";

import { treasuryWithdrawalAbi } from "@/lib/abi";
import { contractsReady, deployment } from "@/lib/contracts";
import { toUserMessage } from "@/lib/errors";
import { statusFromPhase, useTx } from "@/lib/tx-status";

const STATUS = {
  Pending: 0,
  Executed: 1,
  Rejected: 2,
  Expired: 3,
} as const;

function statusLabel(status: number) {
  switch (status) {
    case STATUS.Executed:
      return "Executed";
    case STATUS.Rejected:
      return "Rejected";
    case STATUS.Expired:
      return "Expired";
    default:
      return "Pending";
  }
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatExpiry(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

function ProposalRow({
  proposalId,
  currentAddress,
  isOwner,
  requiredApprovals,
  requiredRejections,
  onVote,
  onExecute,
  onExpire,
  isPending,
}: {
  proposalId: bigint;
  currentAddress?: Address;
  isOwner: boolean;
  requiredApprovals: bigint;
  requiredRejections: bigint;
  onVote: (proposalId: bigint, support: boolean) => Promise<void>;
  onExecute: (proposalId: bigint) => Promise<void>;
  onExpire: (proposalId: bigint) => Promise<void>;
  isPending: boolean;
}) {
  const { data: proposal, refetch: refetchProposal } = useReadContract({
    address: deployment.treasuryWithdrawal,
    abi: treasuryWithdrawalAbi,
    functionName: "getProposal",
    args: [proposalId],
    query: {
      enabled: contractsReady(),
    },
  });

  const { data: ownerVote, refetch: refetchVote } = useReadContract({
    address: deployment.treasuryWithdrawal,
    abi: treasuryWithdrawalAbi,
    functionName: "hasOwnerVoted",
    args: currentAddress
      ? [proposalId, currentAddress]
      : undefined,
    query: {
      enabled: contractsReady() && Boolean(currentAddress) && isOwner,
    },
  });

  if (!proposal) {
    return (
      <div className="rounded-xl border border-novara-line/70 bg-novara-panel2 px-4 py-4">
        <p className="text-sm text-novara-mist">
          Loading proposal #{proposalId.toString()}...
        </p>
      </div>
    );
  }

    const {
        id,
        recipient,
        amount,
        approvalCount,
        rejectionCount,
        expiresAt,
        status,
    } = proposal;

  const hasVoted = ownerVote?.[0] ?? false;
  const votedApprove = ownerVote?.[1] ?? false;

  const expiredByTime =
    status === STATUS.Pending &&
    BigInt(Math.floor(Date.now() / 1000)) >= expiresAt;

  const pending = status === STATUS.Pending;

  const executable =
    pending &&
    approvalCount >= requiredApprovals &&
    !expiredByTime;

  async function refresh() {
    await Promise.all([refetchProposal(), refetchVote()]);
  }

  async function handleVote(support: boolean) {
    await onVote(id, support);
    await refresh();
  }

  async function handleExecute() {
    await onExecute(id);
    await refetchProposal();
  }

  async function handleExpire() {
    await onExpire(id);
    await refetchProposal();
  }

  return (
    <div className="rounded-2xl border border-novara-line/70 bg-novara-panel2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label">Proposal #{id.toString()}</p>
          <p className="mt-1 font-mono text-sm">
            {shortAddress(recipient)}
          </p>
        </div>

        <span className="rounded-full border border-novara-line px-3 py-1 text-xs">
          {statusLabel(Number(status))}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="label">Amount</p>
          <p className="mt-1 font-mono text-sm">
            {formatEther(amount)} ETH
          </p>
        </div>

        <div>
          <p className="label">Approvals</p>
          <p className="mt-1 font-mono text-sm">
            {approvalCount.toString()} / {requiredApprovals.toString()}
          </p>
        </div>

        <div>
          <p className="label">Rejections</p>
          <p className="mt-1 font-mono text-sm">
            {rejectionCount.toString()} / {requiredRejections.toString()}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-novara-mist">
        <Clock3 className="h-3.5 w-3.5" />
        <span>
          {expiredByTime ? "Expired" : `Expires ${formatExpiry(expiresAt)}`}
        </span>
      </div>

      {pending && isOwner ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleVote(true)}
            disabled={isPending || hasVoted || expiredByTime}
          >
            {hasVoted && votedApprove ? "Approved" : "Approve"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleVote(false)}
            disabled={isPending || hasVoted || expiredByTime}
          >
            {hasVoted && !votedApprove ? "Rejected" : "Reject"}
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleExecute}
            disabled={
                isPending ||
                !executable
            }
          >
            Execute
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleExpire}
            disabled={isPending || !expiredByTime}
          >
            Mark Expired
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function WithdrawalPanel() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { tx, setPhase } = useTx();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [durationHours, setDurationHours] = useState("24");

  const ready = contractsReady();

  const { data: treasuryBalance, refetch: refetchTreasury } =
    useReadContract({
      address: deployment.treasuryWithdrawal,
      abi: treasuryWithdrawalAbi,
      functionName: "treasuryBalance",
      query: {
        enabled: ready,
      },
    });

  const { data: nextProposalId, refetch: refetchNextProposalId } =
    useReadContract({
      address: deployment.treasuryWithdrawal,
      abi: treasuryWithdrawalAbi,
      functionName: "nextProposalId",
      query: {
        enabled: ready,
      },
    });

  const { data: requiredApprovals } = useReadContract({
    address: deployment.treasuryWithdrawal,
    abi: treasuryWithdrawalAbi,
    functionName: "requiredApprovals",
    query: {
      enabled: ready,
    },
  });

  const { data: requiredRejections } = useReadContract({
    address: deployment.treasuryWithdrawal,
    abi: treasuryWithdrawalAbi,
    functionName: "requiredRejections",
    query: {
      enabled: ready,
    },
  });

  const { data: maxDuration } = useReadContract({
    address: deployment.treasuryWithdrawal,
    abi: treasuryWithdrawalAbi,
    functionName: "MAX_PROPOSAL_DURATION",
    query: {
      enabled: ready,
    },
  });

  const { data: isOwner } = useReadContract({
    address: deployment.treasuryWithdrawal,
    abi: treasuryWithdrawalAbi,
    functionName: "isOwner",
    args: address ? [address] : undefined,
    query: {
      enabled: ready && Boolean(address),
    },
  });

  const proposalIds = useMemo(() => {
    const next = Number(nextProposalId ?? 1n);

    if (next <= 1) {
      return [];
    }

    return Array.from(
      { length: next - 1 },
      (_, index) => BigInt(index + 1),
    );
  }, [nextProposalId]);

  async function refresh() {
    await Promise.all([
      refetchTreasury(),
      refetchNextProposalId(),
    ]);
  }

  async function handleCreateProposal() {
    if (!address) {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Wallet not connected",
      });
      return;
    }

    if (!isOwner) {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Connected wallet is not a treasury owner",
      });
      return;
    }

    if (!isAddress(recipient)) {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Enter a valid recipient address",
      });
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Enter a valid ETH amount",
      });
      return;
    }

    const hours = Number(durationHours);

    if (!Number.isInteger(hours) || hours <= 0) {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Enter a valid expiry duration",
      });
      return;
    }

    const duration = BigInt(hours) * 3600n;

    if (maxDuration !== undefined && duration > maxDuration) {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Expiry exceeds the maximum allowed duration",
      });
      return;
    }

    let parsedAmount: bigint;

    try {
      parsedAmount = parseEther(amount);
    } catch {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Invalid ETH amount",
      });
      return;
    }

    if (
      treasuryBalance !== undefined &&
      parsedAmount > treasuryBalance
    ) {
      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: "Insufficient treasury balance",
      });
      return;
    }

    try {
      setPhase("wallet", {
        label: "Create withdrawal proposal",
        error: undefined,
        hash: undefined,
      });

      const hash = await writeContractAsync({
        address: deployment.treasuryWithdrawal,
        abi: treasuryWithdrawalAbi,
        functionName: "createWithdrawalProposal",
        args: [
          recipient as Address,
          parsedAmount,
          duration,
        ],
      });

      setPhase("confirmed", {
        hash,
        label: "Create withdrawal proposal",
      });

      setRecipient("");
      setAmount("");
      await refresh();
    } catch (error) {
      const message = toUserMessage(error);

      setPhase("failed", {
        label: "Create withdrawal proposal",
        error: message,
      });
    }
  }

  async function handleVote(
    proposalId: bigint,
    support: boolean,
  ) {
    try {
      const label = support
        ? "Approve withdrawal"
        : "Reject withdrawal";

      setPhase("wallet", {
        label,
        error: undefined,
        hash: undefined,
      });

      const hash = await writeContractAsync({
        address: deployment.treasuryWithdrawal,
        abi: treasuryWithdrawalAbi,
        functionName: "voteOnWithdrawalProposal",
        args: [proposalId, support],
      });

      setPhase("confirmed", { hash, label });
    } catch (error) {
      const label = support
        ? "Approve withdrawal"
        : "Reject withdrawal";

      setPhase("failed", {
        label,
        error: toUserMessage(error),
      });
    }
  }

  async function handleExecute(proposalId: bigint) {
    try {
      setPhase("wallet", {
        label: "Execute withdrawal",
        error: undefined,
        hash: undefined,
      });

      const hash = await writeContractAsync({
        address: deployment.treasuryWithdrawal,
        abi: treasuryWithdrawalAbi,
        functionName: "executeWithdrawalProposal",
        args: [proposalId],
      });

      setPhase("confirmed", {
        hash,
        label: "Execute withdrawal",
      });

      await refetchTreasury();
    } catch (error) {
      setPhase("failed", {
        label: "Execute withdrawal",
        error: toUserMessage(error),
      });
    }
  }

  async function handleExpire(proposalId: bigint) {
    try {
      setPhase("wallet", {
        label: "Expire withdrawal proposal",
        error: undefined,
        hash: undefined,
      });

      const hash = await writeContractAsync({
        address: deployment.treasuryWithdrawal,
        abi: treasuryWithdrawalAbi,
        functionName: "expireProposal",
        args: [proposalId],
      });

      setPhase("confirmed", {
        hash,
        label: "Expire withdrawal proposal",
      });

    } catch (error) {
      setPhase("failed", {
        label: "Expire withdrawal proposal",
        error: toUserMessage(error),
      });
    }
  }

  return (
    <section className="panel panel-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">Treasury Governance</p>
          <h2 className="mt-1 text-lg font-semibold">
            ETH Withdrawals
          </h2>
        </div>

        <WalletCards className="h-4 w-4 text-novara-gold" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
          <p className="label">Treasury</p>
          <p className="mt-1 font-mono text-sm">
            {formatEther(treasuryBalance ?? 0n)} ETH
          </p>
        </div>

        <div className="rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
          <p className="label">Approval threshold</p>
          <p className="mt-1 font-mono text-sm">
            {requiredApprovals?.toString() ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
          <p className="label">Rejection threshold</p>
          <p className="mt-1 font-mono text-sm">
            {requiredRejections?.toString() ?? "-"}
          </p>
        </div>
      </div>

      {!isConnected ? (
        <p className="mt-4 text-sm text-novara-mist">
          Connect a wallet to manage treasury proposals.
        </p>
      ) : !isOwner ? (
        <p className="mt-4 text-sm text-amber-300">
          Connected wallet is not an authorized treasury owner.
        </p>
      ) : (
        <>
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-novara-gold" />
              <p className="label">Create withdrawal proposal</p>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                value={recipient}
                onChange={(event) =>
                  setRecipient(event.target.value)
                }
                placeholder="Recipient address"
                className="min-w-0 rounded-xl border border-novara-line bg-novara-panel2 px-3 py-3 font-mono text-sm outline-none"
              />

              <input
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                inputMode="decimal"
                placeholder="ETH amount"
                className="min-w-0 rounded-xl border border-novara-line bg-novara-panel2 px-3 py-3 font-mono text-sm outline-none"
              />

              <input
                value={durationHours}
                onChange={(event) =>
                  setDurationHours(event.target.value)
                }
                inputMode="numeric"
                placeholder="Expiry (hours)"
                className="min-w-0 rounded-xl border border-novara-line bg-novara-panel2 px-3 py-3 font-mono text-sm outline-none"
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-novara-mist">
                Maximum expiry:{" "}
                {maxDuration
                  ? `${Number(maxDuration) / 3600} hours`
                  : "..."}
              </p>

              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateProposal}
                disabled={
                  !ready ||
                  isPending ||
                  tx.phase === "wallet"
                }
              >
                Create Proposal
              </button>
            </div>
          </div>
        </>
      )}

      {proposalIds.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p className="label">Proposals</p>

          {proposalIds
            .slice()
            .reverse()
            .map((proposalId) => (
              <ProposalRow
                key={proposalId.toString()}
                proposalId={proposalId}
                currentAddress={address}
                isOwner={Boolean(isOwner)}
                requiredApprovals={requiredApprovals ?? 0n}
                requiredRejections={requiredRejections ?? 0n}
                onVote={handleVote}
                onExecute={handleExecute}
                onExpire={handleExpire}
                isPending={isPending || tx.phase === "wallet"}
              />
            ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-novara-mist">
          No withdrawal proposals yet.
        </p>
      )}

      {tx.phase === "failed" && tx.error ? (
        <p className="mt-4 text-sm text-red-300">{tx.error}</p>
      ) : null}
    </section>
  );
}