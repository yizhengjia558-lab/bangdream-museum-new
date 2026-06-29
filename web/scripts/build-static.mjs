import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: webRoot,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_STATIC_EXPORT: "1" },
});

process.exit(result.status ?? 1);
