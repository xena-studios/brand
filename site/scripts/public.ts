// Fills .public/, the folder Astro serves as-is: the site's own static files
// (static/), then every brand file from the repo at its repo path, so
// brand.xenastudios.co/raptor/icon.png is raptor/icon.png. Only tracked files
// are copied, so a half-finished local export never ships.
//
//   pnpm files      (pnpm dev and pnpm build run it first)
import fs from "node:fs";
import path from "node:path";
import { FILE_DIRS, ROOT, tracked } from "../src/lib/repo.ts";

const SITE = path.resolve(import.meta.dirname, "..");
const OUT = path.join(SITE, ".public");

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(SITE, "static"), OUT, { recursive: true });

const files = tracked().filter((f) => FILE_DIRS.includes(f.split("/")[0]));
for (const f of files) {
  const dest = path.join(OUT, f);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), dest);
}
console.log(`copied ${files.length} brand files into .public/`);
