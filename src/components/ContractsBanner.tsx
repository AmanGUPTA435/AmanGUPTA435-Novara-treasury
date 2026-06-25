"use client";

import { contractsReady } from "@/lib/contracts";

export function ContractsBanner() {
  if (contractsReady()) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      Local contracts were not detected. Start Anvil and run <span className="font-mono">npm run deploy</span>, or use{" "}
      <span className="font-mono">npm run dev</span> to boot the full stack.
    </div>
  );
}
