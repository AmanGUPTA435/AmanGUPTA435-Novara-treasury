"use client";

import { ChevronDown, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "@/lib/format";
import type { EIP1193Provider } from "viem";

const ANVIL_ACCOUNTS = [
  {
    index: 0,
    label: "Anvil Account #0",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  {
    index: 1,
    label: "Anvil Account #1",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  {
    index: 2,
    label: "Anvil Account #2",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },
] as const;

export function ConnectWallet() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="btn-secondary min-w-[148px]"
        type="button"
        disabled
      >
        Connect
      </button>
    );
  }

  const anvil = connectors.find(
    (item) =>
      item.id.includes("anvil") ||
      item.name.toLowerCase().includes("anvil"),
  );

  const injected = connectors.find(
    (item) =>
      item.id === "injected" ||
      item.name.toLowerCase() === "injected",
  );

  const usingAnvil = connector?.id === "anvilLocal";

  async function switchAnvilAccount(index: number) {
    if (!usingAnvil || !connector) {
      return;
    }

    setSwitching(true);
    setError(undefined);

    try {
      const provider = (await connector.getProvider()) as EIP1193Provider;

      await (
        provider.request as (
          args: {
            method: "anvil_switchAccount";
            params: [number];
          },
        ) => Promise<unknown>
      )({
        method: "anvil_switchAccount",
        params: [index],
      });

      setOpen(false);
    } catch (switchError) {
      console.error("[novara] failed to switch Anvil account", switchError);
      setError("Unable to switch Anvil account.");
    } finally {
      setSwitching(false);
    }
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setError(undefined);
          }}
          className="btn-secondary max-w-full font-mono text-xs sm:text-sm"
          title="Wallet options"
          disabled={switching}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {shortenAddress(address)}
          <ChevronDown className="h-4 w-4" />
        </button>

        {open ? (
          <div className="absolute right-0 z-40 mt-2 w-[min(100vw-1.5rem,280px)] rounded-xl border border-novara-line bg-novara-panel2 p-2 shadow-panel">
            {usingAnvil ? (
              <>
                <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-novara-mist">
                  Switch Anvil account
                </p>

                {ANVIL_ACCOUNTS.map((account) => {
                  const active =
                    address.toLowerCase() === account.address.toLowerCase();

                  return (
                    <button
                      key={account.index}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-white/5 disabled:opacity-50"
                      onClick={() => switchAnvilAccount(account.index)}
                      disabled={switching || active}
                    >
                      <span>
                        <span className="block text-sm">
                          {account.label}
                        </span>
                        <span className="font-mono text-[11px] text-novara-mist">
                          {shortenAddress(account.address)}
                        </span>
                      </span>

                      {active ? (
                        <span className="text-xs text-emerald-300">
                          Active
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                <div className="my-2 border-t border-novara-line" />
              </>
            ) : null}

            <button
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-white/5"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              disabled={switching}
            >
              Disconnect
            </button>

            {error ? (
              <p className="px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          setOpen((value) => !value);
          setError(undefined);
        }}
        disabled={isPending}
      >
        <Wallet className="h-4 w-4" />
        Connect
        <ChevronDown className="hidden h-4 w-4 sm:block" />
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(100vw-1.5rem,240px)] rounded-xl border border-novara-line bg-novara-panel2 p-2 shadow-panel">
          {anvil ? (
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
              onClick={() => {
                connect({ connector: anvil });
                setOpen(false);
                setError(undefined);
              }}
            >
              Anvil Local Wallet
            </button>
          ) : null}

          {injected ? (
            <button
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
              onClick={() => {
                connect({ connector: injected });
                setOpen(false);
                setError(undefined);
              }}
            >
              Browser Wallet
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}