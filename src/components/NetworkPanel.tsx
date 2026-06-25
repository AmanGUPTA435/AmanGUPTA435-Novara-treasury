"use client";

import { useAccount, useChainId } from "wagmi";
import { ANVIL_CHAIN_ID } from "@/lib/constants";
import { shortenAddress } from "@/lib/format";

export function NetworkPanel() {
  const { address, isConnected, status } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = isConnected && chainId !== ANVIL_CHAIN_ID;

  return (
    <section className="panel panel-pad">
      <p className="label">Session</p>
      <h2 className="mt-1 text-lg font-semibold">Wallet / network</h2>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
          <dt className="text-novara-mist">Status</dt>
          <dd className="mt-1 font-medium">
            {isConnected ? "Connected" : status === "connecting" ? "Connecting" : "Disconnected"}
          </dd>
        </div>
        <div className="min-w-0 rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
          <dt className="text-novara-mist">Network</dt>
          <dd className="mt-1 font-medium">{wrongNetwork ? "Unsupported" : "Anvil Local"}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
          <dt className="text-novara-mist">Chain ID</dt>
          <dd className="mt-1 font-mono">{chainId || ANVIL_CHAIN_ID}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-novara-line/70 bg-novara-panel2 px-3 py-3">
          <dt className="text-novara-mist">Address</dt>
          <dd className="mt-1 font-mono">{address ? shortenAddress(address) : "—"}</dd>
        </div>
      </dl>
      {wrongNetwork ? (
        <p className="mt-3 text-sm text-amber-300">Wrong network. Switch to Anvil Local (31337).</p>
      ) : null}
    </section>
  );
}
