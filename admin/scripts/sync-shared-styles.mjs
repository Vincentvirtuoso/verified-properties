import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../../shared/styles");
const dest = path.resolve(here, "../src/styles");

if (!existsSync(src)) {
  console.error(`[sync-styles] Source not found: ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });

console.log(`[sync-styles] Copied ${src} -> ${dest}`);
