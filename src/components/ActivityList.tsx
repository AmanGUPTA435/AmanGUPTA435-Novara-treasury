"use client";

import { useAccount } from "wagmi";
import { useTx } from "@/lib/tx-status";
import { shortenAddress } from "@/lib/format";

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "confirmed"
      ? "text-emerald-300 bg-emerald-400/10"
      : status === "failed"
        ? "text-red-300 bg-red-400/10"
        : "text-amber-200 bg-amber-400/10";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide ${tone}`}>
      {status}
    </span>
  );
}

export function ActivityList() {
  const { isConnected } = useAccount();
  const { activity } = useTx();

  if (!isConnected) {
    return <p className="text-sm text-novara-mist">Connect a wallet to view local activity.</p>;
  }

  if (activity.length === 0) {
    return <p className="text-sm text-novara-mist">No local transactions yet.</p>;
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="hidden grid-cols-[0.8fr_1.2fr_0.7fr_1.4fr_0.8fr] gap-3 px-2 text-[11px] uppercase tracking-[0.16em] text-novara-mist md:grid">
        <span>Type</span>
        <span>Amount</span>
        <span>Status</span>
        <span>Transaction</span>
        <span>Time</span>
      </div>
      {activity.map((item) => (
        <article
          key={item.id}
          className="min-w-0 rounded-xl border border-novara-line/80 bg-novara-panel2 px-3 py-3"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[0.8fr_1.2fr_0.7fr_1.4fr_0.8fr] md:items-center">
            <div>
              <p className="label md:hidden">Type</p>
              <p className="font-medium">{item.type}</p>
            </div>
            <div className="min-w-0">
              <p className="label md:hidden">Amount</p>
              <p className="truncate font-mono text-sm">{item.amount}</p>
            </div>
            <div>
              <p className="label md:hidden">Status</p>
              <StatusPill status={item.status} />
            </div>
            <div className="min-w-0">
              <p className="label md:hidden">Transaction</p>
              <p className="break-all font-mono text-xs text-novara-gold2">
                {item.hash ? shortenAddress(item.hash) : "—"}
              </p>
              {item.blockNumber ? (
                <p className="mt-1 text-xs text-novara-mist">Block {item.blockNumber}</p>
              ) : null}
            </div>
            <div>
              <p className="label md:hidden">Time</p>
              <p className="text-xs text-novara-mist">
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
