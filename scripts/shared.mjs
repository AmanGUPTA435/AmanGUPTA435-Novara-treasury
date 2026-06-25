import os from "node:os";
import path from "node:path";

export const RPC_URL = "http://127.0.0.1:8545";
export const ANVIL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export function prependFoundryPath() {
  const bin = path.join(os.homedir(), ".foundry", "bin");
  process.env.PATH = `${bin}${path.delimiter}${process.env.PATH}`;
}

export async function isRpcReady(url = RPC_URL) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: [],
      }),
    });
    const body = await response.json();
    return Boolean(body?.result);
  } catch {
    return false;
  }
}

export async function waitForRpc(timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isRpcReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for Anvil at ${RPC_URL}`);
}
