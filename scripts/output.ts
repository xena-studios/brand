// Writes a generated SVG and its PNG. Shared by build.ts and the scripts that can
// also run on their own (airfields-brand.ts), so every file is written the same way.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

// Renames every id in a file after the file itself (github/brand.svg's glow is
// "github-brand-glow"). The ids handed out count across the whole build, so
// without this, adding one graphic renumbers every file after it, and the sites
// that inline these SVGs get changes that change nothing. Prefixing with the
// file keeps ids unique when several are inlined on one page.
export function scopeIds(rel: string, svg: string) {
  const slug = rel.replace(/\.svg$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const seen = new Map<string, number>();
  const rename = new Map<string, string>();
  for (const [, old] of svg.matchAll(/ id="([^"]+)"/g)) {
    const base = `${slug}-${old.replace(/\d+/g, "")}`, n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    rename.set(old, n === 1 ? base : `${base}-${n}`);
  }
  return svg.replace(/( id="|url\(#|href="#)([^")]+)/g, (m, pre: string, old: string) => rename.has(old) ? pre + rename.get(old) : m);
}

export type Out = (rel: string, svg: string, pngWidth: number) => void;

/** An `out` that writes under `root` and records each file in `written`. */
export function writer(root: string, written: string[] = []): Out {
  return (rel, svg, pngWidth) => {
    const file = path.join(root, rel);
    svg = scopeIds(rel, svg);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, svg);
    written.push(rel);
    const png = new Resvg(svg, { fitTo: { mode: "width", value: pngWidth }, font: { loadSystemFonts: false } }).render().asPng();
    fs.writeFileSync(file.replace(/\.svg$/, ".png"), png);
  };
}
