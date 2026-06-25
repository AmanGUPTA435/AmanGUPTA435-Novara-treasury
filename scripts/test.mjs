import { spawn } from "node:child_process";
import { prependFoundryPath } from "./shared.mjs";

prependFoundryPath();

const child = spawn("forge", ["test", "-vv"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
