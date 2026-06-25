import { spawn } from "node:child_process";
import { prependFoundryPath } from "./shared.mjs";

prependFoundryPath();

const args = [
  "--chain-id",
  "31337",
  "--balance",
  "10",
  "--block-time",
  "1",
  "--port",
  "8545",
  "--host",
  "127.0.0.1",
  "--silent",
];

const child = spawn("anvil", args, {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

console.log("Anvil listening on http://127.0.0.1:8545 (chainId 31337)");
