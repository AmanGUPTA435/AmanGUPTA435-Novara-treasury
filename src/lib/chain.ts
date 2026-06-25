import { defineChain } from "viem";
import { foundry } from "viem/chains";
import { ANVIL_RPC_URL } from "@/lib/constants";

export const anvilLocal = defineChain({
  ...foundry,
  name: "Anvil Local",
  rpcUrls: {
    default: { http: [ANVIL_RPC_URL] },
    public: { http: [ANVIL_RPC_URL] },
  },
});
