// Checks what CI can without the fonts the build needs (Ethnocentric is
// licensed and never in the repo, so `pnpm check` only runs locally): every
// SVG renders and has its PNG beside it, every PNG is a PNG, every token file
// parses, and every file the README shows or links to exists. `pnpm verify`
// type-checks the scripts first.
//
//   pnpm verify
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(import.meta.dirname, "..");
const tracked = execFileSync("git", ["-C", ROOT, "ls-files"], { encoding: "utf8" }).trim().split("\n");
const problems: string[] = [];
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

for (const file of tracked) {
  const full = path.join(ROOT, file);
  if (file.endsWith(".svg")) {
    try {
      new Resvg(fs.readFileSync(full, "utf8"), { fitTo: { mode: "width", value: 64 }, font: { loadSystemFonts: false } }).render();
    } catch (e) {
      problems.push(`${file}: doesn't render (${(e as Error).message})`);
    }
    if (!tracked.includes(file.replace(/\.svg$/, ".png"))) problems.push(`${file}: no PNG beside it`);
  } else if (file.endsWith(".png")) {
    if (!fs.readFileSync(full).subarray(0, 8).equals(PNG)) problems.push(`${file}: not a PNG`);
  } else if (file.endsWith(".json")) {
    try {
      JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (e) {
      problems.push(`${file}: invalid JSON (${(e as Error).message})`);
    }
  }
}

// Local files the README shows (<img src>, ![]()) or links to ([](path)).
const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
const refs = [...readme.matchAll(/(?:\]\(|src=")([^)"#\s]+)/g)].map((m) => m[1]).filter((r) => !/^[a-z]+:/.test(r));
for (const ref of new Set(refs)) {
  if (!tracked.includes(ref)) problems.push(`README.md: ${ref} doesn't exist`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`verified ${tracked.length} files and ${new Set(refs).size} README references`);
