import {
  createPublicClient,
  createWalletClient,
  hexToNumber,
  http,
  numberToHex,
  type EIP1193Parameters,
  type EIP1193Provider,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ANVIL_PRIVATE_KEY, ANVIL_RPC_URL } from "@/lib/constants";
import { anvilLocal } from "@/lib/chain";

class MiniEmitter {
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void) {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener);
    this.listeners.set(event, set);
  }

  removeListener(event: string, listener: (...args: unknown[]) => void) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }
}

export function createAnvilProvider(): EIP1193Provider {
  const account = privateKeyToAccount(ANVIL_PRIVATE_KEY);
  const emitter = new MiniEmitter();
  const publicClient = createPublicClient({
    chain: anvilLocal,
    transport: http(ANVIL_RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: anvilLocal,
    transport: http(ANVIL_RPC_URL),
  });

  const provider = {
    on: emitter.on.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
    async request(args: EIP1193Parameters) {
      const { method, params = [] } = args;
      const list = params as unknown[];

      switch (method) {
        case "eth_requestAccounts":
        case "eth_accounts":
          return [account.address];
        case "eth_chainId":
          return numberToHex(anvilLocal.id);
        case "net_version":
          return String(anvilLocal.id);
        case "personal_sign":
          return walletClient.signMessage({
            message: { raw: list[0] as Hex },
          });
        case "eth_sendTransaction": {
          const tx = list[0] as {
            to?: Hex;
            data?: Hex;
            value?: Hex;
            gas?: Hex;
            gasPrice?: Hex;
          };
          return walletClient.sendTransaction({
            to: tx.to,
            data: tx.data,
            value: tx.value ? BigInt(tx.value) : undefined,
            gas: tx.gas ? BigInt(tx.gas) : undefined,
            gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
          });
        }
        case "wallet_switchEthereumChain": {
          const requested = hexToNumber((list[0] as { chainId: Hex }).chainId);
          if (requested !== anvilLocal.id) {
            const error = new Error("Wrong network") as Error & { code: number };
            error.code = 4902;
            throw error;
          }
          return null;
        }
        default:
          return publicClient.request({
            method,
            params: list as never,
          } as never);
      }
    },
  };

  return provider as EIP1193Provider;
}

let cached: EIP1193Provider | undefined;

export function getAnvilProvider() {
  if (!cached) cached = createAnvilProvider();
  return cached;
}
