// The plugin catalog: everything another repo needs to list the plugin family, in one
// file, tokens/plugins-catalog.json. The plugins repo copies it (`pnpm brand:sync` in its
// docs) and builds its README table, the docs' home page, sidebar and accents from it, so a
// plugin's name, words and colours are written once, here.
//
//   node scripts/catalog.ts          # writes tokens/plugins-catalog.json (pnpm build does too)
import fs from "node:fs";
import path from "node:path";
import { categories, pluginColors as PC, plugins } from "./plugin-brand.ts";
import { mix, readable } from "./color.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
export const CATALOG = "tokens/plugins-catalog.json";

/** The catalog, as written to tokens/plugins-catalog.json. */
export function catalog() {
  return {
    // Bumped when a field changes meaning or goes away, so readers can refuse an old shape.
    version: 1,
    colors: PC,
    categories,
    plugins: plugins.map((p) => ({
      id: p.id,
      // The full name, such as xUtilities, and how it's split: the prefix is drawn in the accent.
      name: p.prefix + p.name,
      prefix: p.prefix,
      category: p.category,
      // The headline as one line, and in its two tones.
      tagline: p.headline.join("").trim(),
      headline: p.headline.map((part) => part.trim()),
      blurb: p.blurb,
      // Modrinth's summary: the line under the name in search results.
      summary: p.summary,
      released: p.released !== false,
      accent: p.accent,
      // The accent for text on the family's dark background: the accent itself, or a
      // lighter one of the same hue when the accent is too dark to read (4.5:1).
      accentText: readable(p.accent, PC.bg),
      // The docs' tints: a faint wash on the background, and a pale tone of the accent.
      accentLow: mix(PC.bg, p.accent, 0.17),
      accentHigh: mix(p.accent, "#FFFFFF", 0.5),
      // Paths in this repo.
      icon: `plugins/${p.id}/icon.svg`,
      banner: `plugins/${p.id}/banner.png`,
    })),
  };
}

export const catalogText = () => JSON.stringify(catalog(), null, 2) + "\n";

export function writeCatalog() {
  fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, CATALOG), catalogText());
}

if (import.meta.filename === process.argv[1]) {
  writeCatalog();
  console.log(`wrote ${CATALOG}`);
}
