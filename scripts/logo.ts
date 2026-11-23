// The Xena Studios logos, read from the committed outlines in logo/. Every graphic that
// shows XENA STUDIOS (banners, cards, the avatar, the endorsement on product art) draws it
// from these files, not from Ethnocentric, so the whole build runs without that licensed
// font. Only `pnpm build:logos` needs it, to redraw logo/ itself.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const f = (n: number) => +n.toFixed(2);

export type LogoKey = "full" | "short" | "x";
export const logoFiles: Record<LogoKey, string> = { full: "xena-studios", short: "xena", x: "x" };

// logoFile (scripts/build.ts) draws each logo at cap height 100 with 50 of clear space on
// every side, so the ink is the file's width less 100.
const CAP = 100, PAD = 50;
const cache = new Map<LogoKey, { d: string; width: number }>();
function outline(key: LogoKey) {
  let o = cache.get(key);
  if (!o) {
    const svg = fs.readFileSync(path.join(ROOT, `logo/${logoFiles[key]}.svg`), "utf8");
    o = { d: svg.match(/ d="([^"]+)"/)![1], width: Number(svg.match(/ width="([\d.]+)"/)![1]) - 2 * PAD };
    cache.set(key, o);
  }
  return o;
}

/** A logo with its ink top-left at (x, y) and the given cap height, and its ink width. */
export function committedLogo(key: LogoKey, { x = 0, y = 0, cap, fill }: { x?: number; y?: number; cap: number; fill: string }) {
  const o = outline(key), k = cap / CAP;
  return {
    svg: `<path transform="translate(${f(x - PAD * k)} ${f(y - PAD * k)}) scale(${+k.toFixed(5)})" d="${o.d}" fill="${fill}"/>`,
    width: o.width * k,
  };
}

/** XENA STUDIOS, the endorsement on product and plugin art: ink top-left at (x, y), `cap` tall. */
export const endorsement = (x: number, y: number, cap: number, fill: string) => committedLogo("full", { x, y, cap, fill }).svg;
