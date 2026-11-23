// What every brand's art shares: the SVG document, ids, the planet horizon, and oklch
// colours as hex.
import { C } from "../xena-brand.ts";
import { f } from "../type.ts";

let uid = 0;
/** A fresh id; output.ts renames it after the file it ends up in. */
export const id = (p: string) => `${p}${++uid}`;

export const svgDoc = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

export // oklch() → #rrggbb, so Raptor's DESIGN.md tokens render anywhere (resvg,
// image editors) while the oklch values stay the source of truth.
function oklchHex(v: string): string {
  const m = v.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/);
  if (!m) return v.toUpperCase();
  const [L, Ch, h] = [+m[1], +m[2], (+m[3] * Math.PI) / 180];
  const a = Ch * Math.cos(h), b = Ch * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  return "#" + rgb.map((x) => {
    x = Math.min(1, Math.max(0, x));
    x = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(x * 255).toString(16).padStart(2, "0");
  }).join("").toUpperCase();
}
export const hexify = (svg: string) => svg.replace(/oklch\([^)]+\)/g, oklchHex);

// The horizon: a huge planet whose Ion Blue limb arcs across the bottom of the frame.
interface LimbOptions { cx?: number; r?: number; top?: number; sky?: string; body?: string; rim?: string }

export function planetLimb(w: number, h: number, { cx = w * 0.62, r = w * 1.1, top = h * 0.74, sky = C.void, body = C.surface, rim = C.accent }: LimbOptions = {}) {
  const cy = top + r;
  const g = id("limb"), b = id("glow");
  return `<defs><linearGradient id="${g}" x1="0" y1="${f(top)}" x2="0" y2="${f(top + h * 0.5)}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${body}"/><stop offset="1" stop-color="${sky}"/></linearGradient>` +
    `<filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(h * 0.035)}"/></filter></defs>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${rim}" stroke-width="${f(h * 0.05)}" opacity="0.22" filter="url(#${b})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${g})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${rim}" stroke-width="1.5" opacity="0.7"/>`;
}
