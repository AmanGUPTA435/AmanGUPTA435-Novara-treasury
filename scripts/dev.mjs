import { spawn } from "node:child_process";
import {
  ANVIL_PRIVATE_KEY,
  isRpcReady,
  prependFoundryPath,
  waitForRpc,
} from "./shared.mjs";

prependFoundryPath();

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, ...extraEnv },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function start(command, args) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: true,
  });
}

let anvil = null;

if (!(await isRpcReady())) {
  console.log("Starting Anvil on http://127.0.0.1:8545 ...");
  anvil = start("anvil", [
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
  ]);
  await waitForRpc();
} else {
  console.log("Reusing Anvil already running on http://127.0.0.1:8545");
}

await run("forge", ["build"]);
await run("forge", [
  "script",
  "contracts/script/Deploy.s.sol:Deploy",
  "--rpc-url",
  "http://127.0.0.1:8545",
  "--broadcast",
  "--private-key",
  ANVIL_PRIVATE_KEY,
]);

console.log("Contracts deployed. Starting Next.js ...");

const next = start("npx", ["next", "dev"]);

function shutdown() {
  next.kill("SIGINT");
  if (anvil) anvil.kill("SIGINT");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

next.on("exit", (code) => {
  if (anvil) anvil.kill("SIGINT");
  process.exit(code ?? 0);
});
