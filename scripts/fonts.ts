// Every font the build draws with, in one place. All but Ethnocentric are OFL and come
// from npm (Fontsource), so `pnpm install` is all a machine or CI needs, and Renovate keeps
// them current. Ethnocentric is licensed and never in the repo: only `pnpm build:logos`
// needs it, to draw the logos in logo/ and the team photos; everything else reads the
// committed logo files (scripts/logo.ts).
//
// Each font loads the first time it's drawn with, so a partial build loads only what it
// uses. Set a font's env var to use another copy of it.
import fs from "node:fs";
import path from "node:path";
import opentype, { type Font } from "opentype.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const fontsource = (pkg: string, file: string) => path.join(ROOT, "node_modules/@fontsource", pkg, "files", file);

function load(file: string): Font {
  if (!fs.existsSync(file)) {
    console.error(`Missing font: ${file}\nRun pnpm install, or for Ethnocentric see docs/building.md. Set the font's env var to use another copy.`);
    process.exit(1);
  }
  // Copy out the file's own bytes: a small file's Buffer can sit inside Node's
  // shared pool, whose ArrayBuffer holds other data too.
  const b = fs.readFileSync(file);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
}

function lazy(env: string, file: string): Font {
  let font: Font | undefined;
  return new Proxy({} as Font, {
    get(_, key) {
      font ??= load(process.env[env] ?? file);
      const value = Reflect.get(font, key);
      return typeof value === "function" ? value.bind(font) : value;
    },
  });
}

export const fonts = {
  // The logo face (Typodermic, licensed): only for pnpm build:logos.
  ethnocentric: lazy("ETHNOCENTRIC", path.join(ROOT, ".local-fonts/Ethnocentric-Regular.otf")),
  // The face every brand shares: kickers, taglines, labels, badges.
  mono: lazy("MONO", fontsource("jetbrains-mono", "jetbrains-mono-latin-400-normal.woff")),
  monoLight: lazy("MONO_LIGHT", fontsource("jetbrains-mono", "jetbrains-mono-latin-300-normal.woff")),
  monoSemi: lazy("MONO_SEMIBOLD", fontsource("jetbrains-mono", "jetbrains-mono-latin-600-normal.woff")),
  // Raptor's sans.
  hankenBold: lazy("HANKEN_BOLD", fontsource("hanken-grotesk", "hanken-grotesk-latin-700-normal.woff")),
  // The plugin family's sans.
  groteskBold: lazy("GROTESK_BOLD", fontsource("space-grotesk", "space-grotesk-latin-700-normal.woff")),
  // NeoSkript's sans and code faces.
  geistBold: lazy("GEIST_BOLD", fontsource("geist", "geist-latin-700-normal.woff")),
  geistMono: lazy("GEIST_MONO", fontsource("geist-mono", "geist-mono-latin-500-normal.woff")),
  // MostWanted's display face.
  lilita: lazy("LILITA", fontsource("lilita-one", "lilita-one-latin-400-normal.woff")),
  // Airfields' sans.
  figtree: lazy("FIGTREE", fontsource("figtree", "figtree-latin-700-normal.woff")),
};
