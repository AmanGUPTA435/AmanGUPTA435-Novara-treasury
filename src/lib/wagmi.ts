import { injected } from "@wagmi/core";
import { http, createConfig } from "wagmi";
import { anvilWallet } from "@/lib/anvilConnector";
import { anvilLocal } from "@/lib/chain";

export const config = createConfig({
  chains: [anvilLocal],
  connectors: [
    anvilWallet(),
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [anvilLocal.id]: http(anvilLocal.rpcUrls.default.http[0]),
  },
  ssr: true,
});
