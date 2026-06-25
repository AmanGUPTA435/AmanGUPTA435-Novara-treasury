import { spawn } from "node:child_process";
import { ANVIL_PRIVATE_KEY, isRpcReady, prependFoundryPath, waitForRpc } from "./shared.mjs";

prependFoundryPath();

function ensureForge() {
  return new Promise((resolve, reject) => {
    const child = spawn("forge", ["--version"], { shell: true, stdio: "pipe" });
    child.on("error", () => {
      reject(
        new Error(
          "forge was not found. Install Foundry from https://book.getfoundry.sh/getting-started/installation",
        ),
      );
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else {
        reject(
          new Error(
            "forge was not found. Install Foundry from https://book.getfoundry.sh/getting-started/installation",
          ),
        );
      }
    });
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

if (!(await isRpcReady())) {
  console.error("Anvil is not running. Start it first with: npm run chain");
  process.exit(1);
}

await waitForRpc();
await ensureForge();

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

console.log("Deployment written to src/generated/local.json");
