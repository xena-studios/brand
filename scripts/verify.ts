// The checks besides the rebuild (`pnpm check`, which CI also runs): every
// SVG renders and has its PNG beside it, every PNG is a PNG, every token file
// parses, every file the README and docs/ show, link to or name exists, the
// plugin catalog is up to date and matches its schema, no two accents look
// alike, every brand's text reads on its backgrounds, every brand has its full
// set of files, and every file a platform takes is the size that platform
// wants. `pnpm verify` type-checks the scripts first.
//
//   pnpm verify
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { Resvg } from "@resvg/resvg-js";
import { CATALOG, catalog, catalogText } from "./catalog.ts";
import { contrast, distance } from "./color.ts";
import { Ajv2020 } from "ajv/dist/2020.js";

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
// asset folders (other repos' paths, like Raptor's `site/public/og.png`, start
// elsewhere, and this repo's own site/ shares its name, so site/ isn't checked). A name without an extension stands for its SVG and PNG, `<id>`
// and `*` for any name, and a trailing slash for a folder.
const dirs = new Set(tracked.map((f) => f.split("/")[0]).filter((d) => d !== ".github" && d !== "site"));
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

// The catalog matches its schema, the contract the plugins repo reads.
{
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens/plugins-catalog.schema.json"), "utf8"));
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  if (!validate(catalog())) {
    for (const e of validate.errors ?? []) problems.push(`${CATALOG}: ${e.instancePath || "/"} ${e.message}`);
  }
  for (const p of listed) {
    if (!catalog().categories.includes(p.category)) problems.push(`${CATALOG}: ${p.id}'s category ${p.category} isn't one of the categories`);
  }
}

// Every brand's text reads on its backgrounds: text and secondary text at 4.5:1 (WCAG AA),
// the accent at 3:1 (WCAG's minimum for graphics), and the daylight accent, for light
// backgrounds, at 4.5:1 on its own.
{
  const hex = (v: string | { hex: string }) => (typeof v === "string" ? v : v.hex);
  const t = (file: string) => {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens", file), "utf8"));
    return (k: string) => hex(j[k]);
  };
  const X = t("colors.json"), N = t("neoskript.json"), R = t("raptor.json"), M = t("mostwanted.json"), A = t("airfields.json"), P = t("plugins.json");
  const brands: { name: string; bgs: string[]; text: string; muted: string; accent: string; daylight?: [string, string] }[] = [
    { name: "Xena Studios", bgs: [X("void"), X("space"), X("surface")], text: X("text"), muted: X("muted"), accent: X("accent") },
    { name: "NeoSkript", bgs: [N("night"), N("night-raised")], text: N("text"), muted: N("muted"), accent: N("magenta"), daylight: [N("magenta-daylight"), "#FFFFFF"] },
    { name: "Raptor", bgs: [R("ink"), R("ink-raised")], text: R("bone"), muted: R("ash"), accent: R("signal-red"), daylight: [R("signal-red-daylight"), R("daylight")] },
    { name: "MostWanted", bgs: [M("dusk"), M("dusk-raised")], text: M("text"), muted: M("muted"), accent: M("orange"), daylight: [M("orange-daylight"), M("sand-light")] },
    { name: "Airfields", bgs: [A("sky"), A("sky-raised")], text: A("text"), muted: A("muted"), accent: A("gold"), daylight: [A("gold-daylight"), A("cloud")] },
    { name: "Plugins", bgs: [P("bg"), P("raised")], text: P("text"), muted: P("muted"), accent: P("text") },
  ];
  for (const b of brands) {
    for (const bg of b.bgs) {
      for (const [role, fg, min] of [["text", b.text, 4.5], ["muted", b.muted, 4.5], ["accent", b.accent, 3]] as const) {
        const c = contrast(fg, bg);
        if (c < min) problems.push(`${b.name}: ${role} ${fg} is ${c.toFixed(2)}:1 on ${bg}, under ${min}:1`);
      }
    }
    if (b.daylight && contrast(...b.daylight) < 4.5) problems.push(`${b.name}: the daylight accent ${b.daylight[0]} is ${contrast(...b.daylight).toFixed(2)}:1 on ${b.daylight[1]}, under 4.5:1`);
  }
}

// Every brand has its full set: an icon, a README banner and a social preview, and a
// favicon for the brands with a website. Some come from the product's own repo (official/).
{
  const has = (...alts: string[]) => alts.some((f) => tracked.includes(f));
  const sets: [string, string[][]][] = [
    ["raptor", [["raptor/icon.png"], ["raptor/banner.png"], ["raptor/official/og.png"], ["raptor/official/favicon.svg"]]],
    ...["neoskript", "mostwanted", "airfields"].map((b): [string, string[][]] => [b, [[`${b}/icon.png`], [`${b}/banner.png`], [`${b}/social.png`], [`${b}/favicon.png`]]]),
    ...listed.map((p): [string, string[][]] => [`plugins/${p.id}`, [[`plugins/${p.id}/icon.png`], [`plugins/${p.id}/banner.png`], [`plugins/${p.id}/social.png`]]]),
    ...["brand", "website", "dotgithub", "hallow", "plugins"].map((r): [string, string[][]] => [`github/${r}`, [[`github/${r}.png`], [`github/${r}-banner.png`]]]),
  ];
  for (const [brand, files] of sets) {
    for (const alts of files) if (!has(...alts)) problems.push(`${brand}: missing ${alts.join(" or ")}`);
  }
}

// Every file a platform takes is the size it wants, and under its upload limit. PNGs are
// exported at 2× where the platform shows them smaller.
{
  const KB = 1024;
  const rules: [RegExp, number, number, number, string][] = [
    // pattern, width, height, max bytes, what it's for
    [/^avatar\/apple-touch-icon\.png$/, 180, 180, 0, "iOS home-screen icon"],
    [/^airfields\/(themes\/[^/]+\/)?server-icon\.png$/, 64, 64, 0, "Minecraft server icon (exactly 64×64)"],
    [/^(github\/(brand|website|dotgithub|hallow|plugins)|plugins\/[^/]+\/social|neoskript\/social|mostwanted\/social|airfields\/(themes\/[^/]+\/)?social)\.png$/, 1280, 640, 1024 * KB, "GitHub social preview (under 1 MB)"],
    [/^(plugins\/[^/]+\/icon)\.png$/, 512, 512, 256 * KB, "Modrinth icon (under 256 KB)"],
    [/^neoskript\/icon\.png$/, 1024, 1024, 256 * KB, "Modrinth icon (under 256 KB)"],
    [/^social\/(og-card|docs-og)\.png$/, 2400, 1260, 5 * 1024 * KB, "link preview, 1200×630 at 2×"],
    [/^social\/discord-banner\.png$/, 1920, 1080, 10 * 1024 * KB, "Discord server banner, 960×540 at 2×"],
    [/^social\/x-header\.png$/, 3000, 1000, 2 * 1024 * KB, "X header, 1500×500 at 2× (under 2 MB)"],
    [/^(github\/[a-z-]+-banner|(plugins\/[^/]+|neoskript|raptor|mostwanted|airfields(\/themes\/[^/]+)?)\/banner)\.png$/, 3840, 1200, 0, "README and Modrinth banner, 1920×600 at 2×"],
  ];
  for (const [re, , , , what] of rules) {
    if (!tracked.some((f) => re.test(f))) problems.push(`verify.ts: the ${what} rule matches no file`);
  }
  for (const file of tracked) {
    const rule = rules.find(([re]) => re.test(file));
    if (!rule) continue;
    const [, w, h, max, what] = rule;
    const buf = fs.readFileSync(path.join(ROOT, file));
    const [pw, ph] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (pw !== w || ph !== h) problems.push(`${file}: ${pw}×${ph}, but a ${what} is ${w}×${h}`);
    if (max && buf.length > max) problems.push(`${file}: ${Math.round(buf.length / KB)} KB, over the ${Math.round(max / KB)} KB a ${what} allows`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`verified ${tracked.length} files, and ${links} links and ${paths} paths in ${docs.length} docs`);
