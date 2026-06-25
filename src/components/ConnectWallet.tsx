"use client";

import { ChevronDown, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "@/lib/format";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="btn-secondary min-w-[148px]" type="button" disabled>
        Connect
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="btn-secondary max-w-full font-mono text-xs sm:text-sm"
        title="Disconnect"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {shortenAddress(address)}
      </button>
    );
  }

  const anvil =
    connectors.find(
      (connector) => connector.id.includes("anvil") || connector.name.includes("Anvil"),
    ) ?? connectors[0];
  const injected = connectors.find(
    (connector) => connector.id === "injected" || connector.name === "Injected",
  );

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-primary"
        onClick={() => setOpen((value) => !value)}
        disabled={isPending}
      >
        <Wallet className="h-4 w-4" />
        Connect
        <ChevronDown className="hidden h-4 w-4 sm:block" />
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(100vw-1.5rem,240px)] rounded-xl border border-novara-line bg-novara-panel2 p-2 shadow-panel">
          <button
            type="button"
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
            onClick={() => {
              connect({ connector: anvil });
              setOpen(false);
            }}
          >
            Anvil Local Wallet
          </button>
          {injected ? (
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
              onClick={() => {
                connect({ connector: injected });
                setOpen(false);
              }}
            >
              Browser Wallet
            </button>
          ) : null}
          {error ? (
            <p className="px-3 py-2 text-xs text-red-300">Unable to connect wallet.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
