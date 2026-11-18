// Checks what CI can without the fonts the build needs (Ethnocentric is
// licensed and never in the repo, so `pnpm check` only runs locally): every
// SVG renders and has its PNG beside it, every PNG is a PNG, every token file
// parses, every file the README and docs/ show, link to or name exists, the
// plugin catalog is up to date, and no two accents look alike. `pnpm verify`
// type-checks the scripts first.
//
//   pnpm verify
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { Resvg } from "@resvg/resvg-js";
import { CATALOG, catalog, catalogText } from "./catalog.ts";
import { contrast, distance } from "./color.ts";

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

// The plugin catalog matches the plugins it's made from.
if (fs.existsSync(path.join(ROOT, CATALOG)) && fs.readFileSync(path.join(ROOT, CATALOG), "utf8") === catalogText()) {
  // Up to date.
} else {
  problems.push(`${CATALOG}: out of date; run node scripts/catalog.ts`);
}

// Every accent in the studio, the plugins' and each brand's own, looks different from every
// other: a new one must stay at least MIN_DISTANCE (OKLab) from all the rest. The closest
// pair today is xUtilities' amber and MostWanted's orange, at 0.073.
const MIN_DISTANCE = 0.07;
const token = (file: string, key: string) => {
  const value = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens", file), "utf8"))[key];
  return typeof value === "string" ? value : value.hex;
};
const { plugins: listed, colors } = catalog();
const accents: [string, string][] = [
  ["Xena Ion Blue", token("colors.json", "accent")],
  ["Raptor", token("raptor.json", "signal-red")],
  ["NeoSkript", token("neoskript.json", "magenta")],
  ["MostWanted", token("mostwanted.json", "orange")],
  ["Airfields", token("airfields.json", "gold")],
  ...listed.map((p): [string, string] => [p.name, p.accent]),
];
for (let i = 0; i < accents.length; i++) {
  for (let j = i + 1; j < accents.length; j++) {
    const d = distance(accents[i][1], accents[j][1]);
    if (d < MIN_DISTANCE) {
      problems.push(`${accents[i][0]} (${accents[i][1]}) and ${accents[j][0]} (${accents[j][1]}) look alike: ${d.toFixed(3)} apart, under ${MIN_DISTANCE}`);
    }
  }
}
// Each plugin's text colour reads on the family's background.
for (const p of listed) {
  if (contrast(p.accentText, colors.bg) < 4.5) problems.push(`${p.name}: accentText ${p.accentText} is under 4.5:1 on ${colors.bg}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`verified ${tracked.length} files, and ${links} links and ${paths} paths in ${docs.length} docs`);
