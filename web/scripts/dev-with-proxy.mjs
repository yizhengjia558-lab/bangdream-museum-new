import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptsDir, "..");
const proxyScript = path.join(scriptsDir, "dev-asset-proxy.mjs");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");

function run(command, args, cwd = webRoot) {
  return spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

const proxy = run(process.execPath, [proxyScript]);
const next = run(process.execPath, [nextBin, "dev"]);

function shutdown(code = 0) {
  proxy.kill("SIGTERM");
  next.kill("SIGTERM");
  process.exit(code);
}

proxy.on("exit", (code) => {
  if (code && code !== 0) shutdown(code);
});
next.on("exit", (code) => shutdown(code ?? 0));

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
