import { createConnector } from "wagmi";
import { getAddress, type Address, type EIP1193Provider } from "viem";
import { getAnvilProvider } from "@/lib/anvilProvider";
import { ANVIL_CHAIN_ID } from "@/lib/constants";

export function anvilWallet() {
  let connected = false;

  return createConnector<EIP1193Provider>((config) => {
    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        connected = false;
        config.emitter.emit("disconnect");
        return;
      }

      config.emitter.emit("change", {
        accounts: accounts.map((value) => getAddress(value)),
      });
    };

    const onChainChanged = (chainId: string) => {
      config.emitter.emit("change", {
        chainId: Number(chainId),
      });
    };

    return {
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
            ? accounts.map((address) => ({
                address,
                capabilities: {},
              }))
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
        const chain = config.chains.find(
          (item) => item.id === chainId,
        );

        if (!chain) {
          throw new Error("Wrong network");
        }

        config.emitter.emit("change", { chainId });

        return chain;
      },

      async setup() {
        const provider = getAnvilProvider();

        provider.on(
          "accountsChanged",
          onAccountsChanged as (...args: unknown[]) => void,
        );

        provider.on(
          "chainChanged",
          onChainChanged as (...args: unknown[]) => void,
        );
      },

      onAccountsChanged,

      onChainChanged,

      onDisconnect() {
        connected = false;
      },
    };
  });
}