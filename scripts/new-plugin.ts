// Adds a plugin to the family: a placeholder glyph and an entry in plugin-brand.ts, marked
// released: false, with an accent that stays clear of every other Xena accent. Then draw
// the glyph, write the words, and run pnpm build:plugins.
//
//   pnpm new-plugin <id> <Name> <category>     e.g. pnpm new-plugin xshop Shop Economy
//
// The id is the plugin's lowercase name (its folder, Modrinth slug and command namespace);
// the name is what follows the prefix letter, which is the id's first letter.
import fs from "node:fs";
import path from "node:path";
import { categories, pluginColors, plugins } from "./plugin-brand.ts";
import { contrast, distance, oklab } from "./color.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const FILE = path.join(ROOT, "scripts/plugin-brand.ts");
const [id, name, category] = process.argv.slice(2);

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};
if (!id || !name || !category) fail("Usage: pnpm new-plugin <id> <Name> <category>, such as: pnpm new-plugin xshop Shop Economy");
if (!/^[a-z][a-z0-9]{1,30}$/.test(id)) fail(`${id}: an id is lowercase letters and digits, such as xshop`);
if (id.slice(1) !== name.toLowerCase()) fail(`${name}: the name is the id after its prefix letter (${id.slice(1)}), capitalised as it's shown`);
if (!(categories as readonly string[]).includes(category)) fail(`${category}: the categories are ${categories.join(", ")}`);
if (plugins.some((p) => p.id === id)) fail(`${id} is already in the family`);

// Every accent the new one must stay clear of: the plugins' and each brand's own.
const token = (file: string, key: string) => {
  const value = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens", file), "utf8"))[key];
  return typeof value === "string" ? value : value.hex;
};
const taken = [
  token("colors.json", "accent"),
  token("raptor.json", "signal-red"),
  token("neoskript.json", "magenta"),
  token("mostwanted.json", "orange"),
  token("airfields.json", "gold"),
  ...plugins.map((p) => p.accent),
];

// Candidates across hues, lightnesses and chromas bright enough for the family's dark
// tiles; the five that are furthest from every taken accent, each a different hue.
const candidates: { hex: string; gap: number }[] = [];
for (let r = 0; r < 256; r += 17) {
  for (let g = 0; g < 256; g += 17) {
    for (let b = 0; b < 256; b += 17) {
      const hex = "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0").toUpperCase()).join("");
      const [L, a, bb] = oklab(hex);
      // Light enough to read as text on the family's dark tiles, and colourful enough to be an accent.
      if (L < 0.62 || L > 0.92 || Math.hypot(a, bb) < 0.1 || contrast(hex, pluginColors.bg) < 4.5) continue;
      candidates.push({ hex, gap: Math.min(...taken.map((t) => distance(hex, t))) });
    }
  }
}
candidates.sort((a, b) => b.gap - a.gap);
const picks: typeof candidates = [];
for (const c of candidates) {
  if (picks.every((p) => distance(p.hex, c.hex) > 0.15)) picks.push(c);
  if (picks.length === 5) break;
}
const accent = picks[0].hex;

const glyphName = id.slice(1);
const blank = Array.from({ length: 16 }, (_, y) =>
  `    "${y === 0 || y === 15 ? "................" : y === 1 || y === 14 ? ".##############." : ".#............#."}",`,
).join("\n");
let text = fs.readFileSync(FILE, "utf8");
const glyphsEnd = text.indexOf("\n};\n", text.indexOf("const glyphs"));
text = text.slice(0, glyphsEnd) +
  `\n  // TODO: ${name}'s glyph, 16×16, "#" filled. A placeholder frame until it's drawn.\n  ${glyphName}: [\n${blank}\n  ],` +
  text.slice(glyphsEnd);
const listEnd = text.lastIndexOf("\n];", text.indexOf("export const family"));
text = text.slice(0, listEnd) + `
  {
    // TODO: why this accent. Picked by new-plugin as the furthest from every other Xena accent.
    id: "${id}", prefix: "${id[0]}", name: "${name}", accent: "${accent}", glyph: "${glyphName}",
    kicker: "// ${name.toUpperCase()} PLUGIN",
    headline: ["TODO: the first half, ", "and the second."],
    summary: "TODO: Modrinth's summary, the line under the name in search results: what it does, for Paper and Folia.",
    category: "${category}",
    blurb: "TODO: one sentence for the docs' home page and the README.",
    released: false,
  },` + text.slice(listEnd);
fs.writeFileSync(FILE, text);

console.log(`Added ${id[0]}${name} to scripts/plugin-brand.ts with accent ${accent} (${picks[0].gap.toFixed(3)} from the nearest).`);
console.log(`Other accents that stay clear: ${picks.slice(1).map((p) => `${p.hex} (${p.gap.toFixed(3)})`).join(", ")}`);
console.log("Next: draw its glyph, write its headline, summary and blurb, then pnpm build:plugins.");
