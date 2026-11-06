// Checks what CI can without the fonts the build needs (Ethnocentric is
// licensed and never in the repo, so `pnpm check` only runs locally): every
// SVG renders and has its PNG beside it, every PNG is a PNG, every token file
// parses, and every file the README and docs/ show, link to or name exists. `pnpm verify`
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

// The README and the guides in docs/: every local file they show (<img src>,
// ![]()) or link to ([](path)) exists, resolved from the doc's own folder. A
// link ending in a slash is a folder.
const docs = tracked.filter((f) => f === "README.md" || /^docs\/[^/]+\.md$/.test(f));
// Paths the docs name in code spans, from the repo root, in this repo's own
// folders (other repos' paths, like Raptor's `site/public/og.png`, start
// elsewhere). A name without an extension stands for its SVG and PNG, `<id>`
// and `*` for any name, and a trailing slash for a folder.
const dirs = new Set(tracked.map((f) => f.split("/")[0]).filter((d) => d !== ".github"));
let links = 0;
let paths = 0;
for (const doc of docs) {
  const text = fs.readFileSync(path.join(ROOT, doc), "utf8");
  const refs = [...text.matchAll(/(?:\]\(|src=")([^)"#\s]+)/g)].map((m) => m[1]).filter((r) => !/^[a-z]+:/.test(r));
  for (const ref of new Set(refs)) {
    const target = path.posix.join(path.posix.dirname(doc), ref);
    const found = ref.endsWith("/") ? tracked.some((f) => f.startsWith(target)) : tracked.includes(target);
    if (!found) problems.push(`${doc}: ${ref} doesn't exist`);
  }
  const spans = [...text.matchAll(/`([^`\s]+\/[^`\s]*)`/g)].map((m) => m[1]).filter((s) => dirs.has(s.split("/")[0]));
  for (const span of new Set(spans)) {
    const re = span.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/<[^>]+>|\*/g, "[^/]*");
    const match = new RegExp(span.endsWith("/") ? `^${re}.+` : `^${re}(\\.(svg|png))?$`);
    if (!tracked.some((f) => match.test(f))) problems.push(`${doc}: \`${span}\` matches no file`);
  }
  links += new Set(refs).size;
  paths += new Set(spans).size;
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`verified ${tracked.length} files, and ${links} links and ${paths} paths in ${docs.length} docs`);
