import { createConnector } from "wagmi";
import { getAddress, type Address, type EIP1193Provider } from "viem";
import { getAnvilProvider } from "@/lib/anvilProvider";
import { ANVIL_CHAIN_ID } from "@/lib/constants";

export function anvilWallet() {
  let connected = false;

  return createConnector<EIP1193Provider>((config) => ({
    id: "anvilLocal",
    name: "Anvil Local Wallet",
    type: "anvil",
    async connect({ withCapabilities } = {}) {
      const provider = getAnvilProvider();
      const raw = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const accounts = raw.map((value) => getAddress(value));
      connected = true;
      return {
        accounts: (withCapabilities
          ? accounts.map((address) => ({ address, capabilities: {} }))
          : accounts) as never,
        chainId: ANVIL_CHAIN_ID,
      };
    },
    async disconnect() {
      connected = false;
    },
    async getAccounts() {
      const raw = (await getAnvilProvider().request({
        method: "eth_accounts",
      })) as string[];
      return raw.map((value) => getAddress(value)) as readonly Address[];
    },
    async getChainId() {
      return ANVIL_CHAIN_ID;
    },
    async getProvider() {
      return getAnvilProvider();
    },
    async isAuthorized() {
      return connected;
    },
    async switchChain({ chainId }) {
      const chain = config.chains.find((item) => item.id === chainId);
      if (!chain) {
        throw new Error("Wrong network");
      }
      config.emitter.emit("change", { chainId });
      return chain;
    },
    onAccountsChanged() {},
    onChainChanged() {},
    onDisconnect() {
      connected = false;
    },
  }));
}
