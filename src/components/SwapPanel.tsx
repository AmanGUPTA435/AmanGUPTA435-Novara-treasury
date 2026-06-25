"use client";

import { ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { erc20Abi, treasurySwapAbi } from "@/lib/abi";
import {
  EXCHANGE_RATE,
  MIN_RECEIVED_BPS,
  TEST_DISPLAY_DECIMALS,
} from "@/lib/constants";
import { contractsReady, deployment } from "@/lib/contracts";
import { toUserMessage } from "@/lib/errors";
import { isPositiveAmount, parseSwapInput } from "@/lib/tokens";
import { statusFromPhase, useTx } from "@/lib/tx-status";

export function SwapPanel() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { setPhase, recordActivity, tx } = useTx();
  const [amount, setAmount] = useState("");
  const ready = contractsReady();

  const { data: testBalance, refetch: refetchTest } = useReadContract({
    address: deployment.testToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && ready },
  });

  const { refetch: refetchEth } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const estimated = useMemo(() => {
    if (!isPositiveAmount(amount)) return "0.000000";
    return (Number(amount) * EXCHANGE_RATE).toFixed(6);
  }, [amount]);

  const minReceived = useMemo(() => {
    return (Number(estimated) * (1 - MIN_RECEIVED_BPS / 10_000)).toFixed(6);
  }, [estimated]);

  const priceImpact = useMemo(() => {
    const value = Number(amount || "0");
    return `${Math.min(0.12, value / 25_000).toFixed(2)}%`;
  }, [amount]);

  const insufficientBalance =
    isPositiveAmount(amount) &&
    testBalance !== undefined &&
    Number(amount) > Number(formatUnits(testBalance, TEST_DISPLAY_DECIMALS));

  async function handleApprove() {
    if (!address) {
      setPhase("failed", { error: "Wallet not connected", label: "Approve TEST" });
      return;
    }
    if (!isPositiveAmount(amount)) {
      setPhase("failed", { error: "Enter an amount", label: "Approve TEST" });
      return;
    }

    try {
      setPhase("wallet", { label: "Approve TEST", error: undefined, hash: undefined });
      const hash = await writeContractAsync({
        address: deployment.testToken,
        abi: erc20Abi,
        functionName: "approve",
        args: [address, parseSwapInput(amount)],
      });
      setPhase("confirmed", { hash, label: "Approve TEST" });
      recordActivity({
        type: "Approve",
        amount: `${amount} TEST`,
        status: statusFromPhase("confirmed"),
        hash,
      });
    } catch (error) {
      setPhase("failed", { error: toUserMessage(error), label: "Approve TEST" });
      recordActivity({
        type: "Approve",
        amount: `${amount || "0"} TEST`,
        status: "failed",
      });
    }
  }

  async function handleSwap() {
    if (!address) {
      setPhase("failed", { error: "Wallet not connected", label: "Swap TEST" });
      return;
    }
    if (!isPositiveAmount(amount)) {
      setPhase("failed", { error: "Enter an amount", label: "Swap TEST" });
      return;
    }
    if (insufficientBalance) {
      setPhase("failed", { error: "Insufficient balance", label: "Swap TEST" });
      return;
    }

    try {
      setPhase("wallet", { label: "Swap TEST", error: undefined, hash: undefined });
      const hash = await writeContractAsync({
        address: deployment.treasurySwap,
        abi: treasurySwapAbi,
        functionName: "swapTestForUsdc",
        args: [parseSwapInput(amount)],
      });
      setPhase("confirmed", { hash, label: "Swap TEST" });
      await refetchTest();
      await refetchEth();
      recordActivity({
        type: "Swap",
        amount: `${amount} TEST → ${estimated} USDC`,
        status: statusFromPhase("confirmed"),
        hash,
      });
    } catch (error) {
      setPhase("failed", { error: toUserMessage(error), label: "Swap TEST" });
      recordActivity({
        type: "Swap",
        amount: `${amount} TEST → ${estimated} USDC`,
        status: "failed",
      });
    }
  }

  return (
    <section className="panel panel-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">Desk</p>
          <h2 className="mt-1 text-lg font-semibold">Swap TEST</h2>
        </div>
        <ArrowDownUp className="h-4 w-4 text-novara-gold" />
      </div>

      <label className="mt-5 block">
        <span className="label">Amount</span>
        <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-novara-line bg-novara-panel2 px-3">
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="min-w-0 flex-1 bg-transparent py-3 font-mono text-base outline-none"
          />
          <span className="text-xs text-novara-mist">TEST</span>
          <button
            type="button"
            className="text-xs font-medium text-novara-gold2"
            onClick={() =>
              setAmount(
                Number(formatUnits(testBalance ?? 0n, TEST_DISPLAY_DECIMALS)).toFixed(4),
              )
            }
            disabled={!isConnected}
          >
            Max
          </button>
        </div>
      </label>

      <div className="my-3 flex justify-center">
        <div className="rounded-full border border-novara-line p-2 text-novara-mist">
          <ArrowDownUp className="h-4 w-4" />
        </div>
      </div>

      <div>
        <span className="label">Estimated USDC</span>
        <div className="mt-2 flex min-w-0 items-center justify-between rounded-xl border border-novara-line bg-novara-panel2 px-3 py-3">
          <span className="truncate font-mono text-base">{estimated}</span>
          <span className="text-xs text-novara-mist">USDC</span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-xl border border-novara-line/70 px-3 py-3">
          <dt className="text-novara-mist">Exchange Rate</dt>
          <dd className="mt-1 font-medium">1 TEST = 0.95 USDC</dd>
        </div>
        <div className="rounded-xl border border-novara-line/70 px-3 py-3">
          <dt className="text-novara-mist">Minimum Received</dt>
          <dd className="mt-1 font-mono">{minReceived} USDC</dd>
        </div>
        <div className="rounded-xl border border-novara-line/70 px-3 py-3">
          <dt className="text-novara-mist">Price Impact</dt>
          <dd className="mt-1 font-mono">{priceImpact}</dd>
        </div>
      </dl>

      {insufficientBalance ? (
        <p className="mt-3 text-sm text-amber-300">Insufficient balance</p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={handleApprove}
          disabled={!isConnected || !ready || isPending || tx.phase === "wallet"}
        >
          Approve TEST
        </button>
        <button
          type="button"
          className="btn-primary w-full"
          onClick={handleSwap}
          disabled={
            !isConnected ||
            !ready ||
            isPending ||
            tx.phase === "wallet" ||
            !isPositiveAmount(amount) ||
            insufficientBalance
          }
        >
          Swap
        </button>
      </div>
    </section>
  );
}
