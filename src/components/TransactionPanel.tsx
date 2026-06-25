"use client";

import { CheckCircle2, CircleDashed, LoaderCircle, ShieldAlert, XCircle } from "lucide-react";
import { useTx, type TxPhase } from "@/lib/tx-status";

const copy: Record<TxPhase, { title: string; detail: string }> = {
  idle: { title: "Idle", detail: "No transaction in progress." },
  wallet: { title: "Waiting for wallet", detail: "Confirm the request in your wallet." },
  submitting: { title: "Submitting", detail: "Broadcasting the transaction to Anvil." },
  pending: { title: "Pending", detail: "Waiting for block inclusion." },
  confirmed: { title: "Confirmed", detail: "The transaction was accepted." },
  failed: { title: "Failed", detail: "The transaction did not complete." },
};

function PhaseIcon({ phase }: { phase: TxPhase }) {
  if (phase === "confirmed") return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
  if (phase === "failed") return <XCircle className="h-5 w-5 text-red-400" />;
  if (phase === "idle") return <CircleDashed className="h-5 w-5 text-novara-mist" />;
  if (phase === "wallet") return <ShieldAlert className="h-5 w-5 text-novara-gold" />;
  return <LoaderCircle className="h-5 w-5 animate-spin text-novara-gold" />;
}

export function TransactionPanel() {
  const { tx, reset } = useTx();
  const meta = copy[tx.phase];

  return (
    <section className="panel panel-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">Status</p>
          <h2 className="mt-1 text-lg font-semibold">Transaction</h2>
        </div>
        <PhaseIcon phase={tx.phase} />
      </div>

      <div className="mt-4 rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
        <p className="text-sm font-medium">{tx.label ?? meta.title}</p>
        <p className="mt-1 text-sm text-novara-mist">{tx.error ?? meta.detail}</p>
      </div>

      <div className="mt-4">
        <p className="label">Local explorer</p>
        {tx.hash ? (
          <a
            href={`#tx/${tx.hash}`}
            className="mt-2 block break-all font-mono text-xs text-novara-gold2"
          >
            {tx.hash}
          </a>
        ) : (
          <p className="mt-2 text-sm text-novara-mist">No transaction hash yet.</p>
        )}
      </div>

      {tx.phase === "failed" || tx.phase === "confirmed" ? (
        <button type="button" className="btn-secondary mt-4 w-full" onClick={reset}>
          Clear status
        </button>
      ) : null}
    </section>
  );
}
