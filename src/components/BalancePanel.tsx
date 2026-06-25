"use client";

import { formatEther, formatUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { contractsReady, deployment } from "@/lib/contracts";
import { TEST_DISPLAY_DECIMALS, USDC_DISPLAY_DECIMALS } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/format";

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
      <p className="label">{label}</p>
      <p className="mt-2 truncate font-mono text-lg text-zinc-100 sm:text-xl">
        {value}
        <span className="ml-2 text-xs text-novara-mist">{suffix}</span>
      </p>
    </div>
  );
}

export function BalancePanel() {
  const { address, isConnected } = useAccount();
  const ready = contractsReady();

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const { data: testBalance } = useReadContract({
    address: deployment.testToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && ready },
  });

  const { data: usdcBalance } = useReadContract({
    address: deployment.mockUsdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && ready },
  });

  return (
    <section className="panel panel-pad">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="label">Balances</p>
          <h2 className="mt-1 text-lg font-semibold">Treasury holdings</h2>
        </div>
      </div>
      {!isConnected ? (
        <p className="text-sm text-novara-mist">Connect a wallet to load balances.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric
            label="TEST"
            value={formatTokenAmount(
              formatUnits(testBalance ?? 0n, TEST_DISPLAY_DECIMALS),
              4,
            )}
            suffix="TEST"
          />
          <Metric
            label="USDC"
            value={formatTokenAmount(
              formatUnits(usdcBalance ?? 0n, USDC_DISPLAY_DECIMALS),
              6,
            )}
            suffix="USDC"
          />
          <Metric
            label="ETH"
            value={formatTokenAmount(formatEther(ethBalance?.value ?? 0n), 4)}
            suffix="ETH"
          />
        </div>
      )}
    </section>
  );
}
