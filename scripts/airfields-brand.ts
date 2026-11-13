// Airfields: Xena's sky-mining PvP Minecraft server. A product with its own
// identity, like Raptor, NeoSkript and MostWanted; Xena supplies only the horizon
// and the XENA STUDIOS endorsement.
//
// The permanent brand is drawn here: the AIRFIELDS wordmark (Unbounded Black,
// outlined, in Airfields Gold), the A monogram and its icon. Seasons dress it
// up without changing it: each theme in `themes` adds a layer (winter's snow cap)
// and its own sky, and is written to airfields/themes/<id>/. The game repo's own
// build (xena-studios/airfields, brand/) syncs these files and draws its scenes.
//
// Runs as part of `pnpm build`, or on its own with `pnpm build:airfields`, which
// needs only Unbounded, Figtree and JetBrains Mono (docs/building.md).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import opentype, { type Font, type PathCommand, type BoundingBox } from "opentype.js";
import { writer, type Out } from "./output.ts";

// Airfields Gold on a high-altitude night. The gold is pushed toward yellow
// (OKLCH hue 96) so it stays clear of the plugin family's amber (xUtilities, 81)
// and MostWanted's Desert Orange (60) and sand (87). Neutrals lean blue (hue 270),
// away from MostWanted's warm dusk.
export const airfieldsColors = {
  gold: "#FFD93D",              // Airfields Gold: the one accent
  "gold-daylight": "#7A5600",   // gold text on light backgrounds (6.2:1 on cloud)
  // The wordmark's metal, top to bottom. For the logo and illustration, not text.
  "gold-light": "#FFF3B0",
  "gold-deep": "#F0B312",
  bronze: "#A8700A",
  "bronze-dark": "#5A3A06",
  sky: "#0B1022",               // page / banner background
  "sky-raised": "#151B38",      // cards, icon tile, planet body
  "sky-rule": "#283058",        // borders
  text: "#F6F4EE",              // text on dark
  muted: "#A7ADC6",             // kickers, secondary text
  ink: "#1A1405",               // text on light, text on gold, the logo's outline
  cloud: "#F6F7FB",             // light backgrounds
};
const A = airfieldsColors;

export const airfields = {
  kicker: "// MINECRAFT SERVER",
  tagline: "Sky-mining PvP on Java & Bedrock",
  summary: "A sky-mining PvP Minecraft server for Java and Bedrock. Mine floating islands, fight ore mobs, forge your gear and hold KOTH.",
};

// ---------------------------------------------------------------- seasonal themes

// A season's layer over the permanent marks: its sky and horizon colours, and
// what it adds to the letters. The marks' shape and gold never change.
export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  sky: string;
  body: string;
  rim: string;
  /** Glow behind the icon's monogram: [colour, opacity]. */
  glow: [string, number][];
  /** Drawn over each letter, clipped to it: the letter's ink box and cap height. */
  cap?: (box: BoundingBox, capH: number, rand: () => number) => string;
  capFill?: [string, string, string];
  /** Extra marks over a scene (stars, snow), w × h. */
  scenery?: (w: number, h: number, rand: () => number) => string;
}

const winterColors = {
  navy: "#0A1230",
  night: "#111C45",
  "night-raised": "#1B2A62",
  frost: "#F4F9FF",
  "frost-shade": "#9CC2E9",
  "aurora-teal": "#3CF2C6",
  "aurora-violet": "#9A7BFF",
};
const W = winterColors;

export const themes: Theme[] = [
  {
    id: "winter",
    name: "Winter",
    colors: winterColors,
    sky: W.navy,
    body: W.night,
    rim: W["aurora-teal"],
    glow: [[W["aurora-teal"], 0.3], [W["aurora-violet"], 0.16]],
    // A snow cap: a band over the letter's top with a soft, dripping lower edge.
    cap: (box, capH, rand) => {
      const top = box.y1 - capH * 0.25, depth = capH * (0.2 + rand() * 0.04);
      const x1 = box.x1 - capH * 0.12, x2 = box.x2 + capH * 0.12, y = box.y1 + depth;
      const steps = Math.max(2, Math.round((x2 - x1) / (capH * 0.26))), w = (x2 - x1) / steps;
      let d = `M${f(x1)} ${f(top)}L${f(x2)} ${f(top)}L${f(x2)} ${f(y)}`;
      for (let i = steps - 1; i >= 0; i--) {
        const sx = x1 + i * w, drip = rand() < 0.3 ? capH * (0.1 + rand() * 0.08) : capH * (0.02 + rand() * 0.04);
        d += `Q${f(sx + w / 2)} ${f(y + drip * 2)} ${f(sx)} ${f(y)}`;
      }
      return d + "Z";
    },
    capFill: ["#FFFFFF", W.frost, W["frost-shade"]],
    scenery: (w, h, rand) => {
      let s = "";
      for (let i = 0; i < Math.round((w * h) / 9000); i++) {
        const r = (0.6 + rand() * 1.8) * (w / 1280);
        s += `<circle cx="${f(rand() * w)}" cy="${f(rand() * h * 0.85)}" r="${f(r)}" fill="#FFFFFF" opacity="${f(0.2 + rand() * 0.45)}"/>`;
      }
      return s;
    },
  },
];

// ---------------------------------------------------------------- helpers

const f = (n: number) => +n.toFixed(2);
let uid = 0;
const id = (p: string) => `${p}${++uid}`;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pathData = (cmds: PathCommand[]) => cmds.map((c) =>
  c.type === "Z" ? "Z" :
  c.type === "Q" ? `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}` :
  c.type === "C" ? `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}` :
  `${c.type}${f(c.x)} ${f(c.y)}`).join("");

const svgDoc = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${body}</svg>`;

interface Glyph { d: string; box: BoundingBox; cmds: PathCommand[] }

/** Lays out `str` (kerning + tracking in em), baseline at y = 0, ink starting at x = 0. */
function lay(font: Font, str: string, size: number, tracking: number) {
  const scale = size / font.unitsPerEm, gs = [...str].map((c) => font.charToGlyph(c));
  let x = 0;
  const glyphs: Glyph[] = [];
  gs.forEach((g, i) => {
    // Draw at the origin and shift copies ourselves: opentype.js can reuse a
    // command object within a path, and shifting it in place moves it twice.
    const p = new opentype.Path();
    for (const c of g.getPath(0, 0, size).commands) {
      const t: Record<string, string | number> = { ...c };
      for (const k of ["x", "x1", "x2"]) if (typeof t[k] === "number") t[k] = (t[k] as number) + x;
      p.commands.push(t as PathCommand);
    }
    p.commands = tidy(p.commands, str[i], size);
    glyphs.push({ d: pathData(p.commands), box: p.getBoundingBox(), cmds: p.commands });
    x += g.advanceWidth * scale;
    if (i < gs.length - 1) x += font.getKerningValue(g, gs[i + 1]) * scale + tracking * size;
  });
  const box = {
    x1: Math.min(...glyphs.map((g) => g.box.x1)), y1: Math.min(...glyphs.map((g) => g.box.y1)),
    x2: Math.max(...glyphs.map((g) => g.box.x2)), y2: Math.max(...glyphs.map((g) => g.box.y2)),
  };
  return { glyphs, box, d: glyphs.map((g) => g.d).join("") };
}

/**
 * Cleans a glyph's outline for stroking. Unbounded closes each contour with a line
 * back to its start before the Z; that zero-length last segment leaves the stroke
 * with no join there, which shows as a notch in the outline. And its E has a small
 * notch in the left side, which reads as a glitch once outlined: straightened.
 */
function tidy(cmds: PathCommand[], ch: string, size: number): PathCommand[] {
  const out: PathCommand[] = [];
  let start: { x: number; y: number } | null = null;
  cmds.forEach((c, i) => {
    if (c.type === "M") start = { x: c.x, y: c.y };
    const next = cmds[i + 1];
    if (c.type === "L" && next?.type === "Z" && start && Math.hypot(c.x - start.x, c.y - start.y) < 0.01) return;
    out.push(c);
  });
  if (ch === "E") {
    const xs = out.flatMap((c) => ("x" in c ? [c.x] : []));
    const left = Math.min(...xs);
    for (const c of out) if (c.type === "L" && c.x > left && c.x - left < size * 0.08) c.x = left;
  }
  return out;
}

/** A contour as points: curves flattened into short lines. */
function polygons(cmds: PathCommand[]) {
  const polys: [number, number][][] = [];
  let cur: [number, number][] = [];
  let px = 0, py = 0;
  for (const c of cmds) {
    if (c.type === "M") { if (cur.length) polys.push(cur); cur = [[c.x, c.y]]; px = c.x; py = c.y; }
    else if (c.type === "L") { cur.push([c.x, c.y]); px = c.x; py = c.y; }
    else if (c.type === "Q") {
      for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t; cur.push([u * u * px + 2 * u * t * c.x1 + t * t * c.x, u * u * py + 2 * u * t * c.y1 + t * t * c.y]); }
      px = c.x; py = c.y;
    } else if (c.type === "C") {
      for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; cur.push([u ** 3 * px + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t ** 3 * c.x, u ** 3 * py + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t ** 3 * c.y]); }
      px = c.x; py = c.y;
    } else if (c.type === "Z") { if (cur.length) polys.push(cur); cur = []; }
  }
  if (cur.length) polys.push(cur);
  return polys;
}

/**
 * The extrusion's sides: every edge of the outline swept straight down by dz, as
 * quads all wound the same way, so with the face and its shifted copy they fill
 * the solid exactly (no stepped copies, no seams).
 */
function sweep(cmds: PathCommand[], dz: number) {
  let d = "";
  for (const poly of polygons(cmds)) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      if (Math.abs(x2 - x1) < 1e-6) continue;
      // Clockwise in screen space: left to right along the top, back along the bottom.
      const [ax, ay, bx, by] = x1 < x2 ? [x1, y1, x2, y2] : [x2, y2, x1, y1];
      d += `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}L${f(bx)} ${f(by + dz)}L${f(ax)} ${f(ay + dz)}Z`;
    }
  }
  return d;
}

/** Plain text as one path, anchored by its ink. */
function text(font: Font, str: string, o: { x: number; y: number; size: number; tracking?: number; anchor?: "start" | "middle" | "end"; fill: string }) {
  const t = lay(font, str, o.size, o.tracking ?? 0);
  const w = t.box.x2 - t.box.x1, a = o.anchor ?? "start";
  const x = (a === "start" ? o.x : a === "end" ? o.x - w : o.x - w / 2) - t.box.x1;
  return { svg: `<path transform="translate(${f(x)} ${f(o.y)})" d="${t.d}" fill="${o.fill}"/>`, width: w };
}

// ---------------------------------------------------------------- the marks

interface Metal { svg: string; width: number; height: number }

/**
 * The Airfields letter treatment, for the wordmark and the monogram: a gold face
 * lit from above, a bronze extrusion straight down, and one ink outline around
 * both so it holds on any background. A theme's cap goes on each letter, inside
 * the outline. Returns the art with its top-left at (0, 0).
 */
function metal(font: Font, str: string, size: number, { tracking = 0.06, theme, seed = 7, outline = 0.055, depth = 0.08 }: { tracking?: number; theme?: Theme; seed?: number; outline?: number; depth?: number } = {}): Metal {
  const t = lay(font, str, size, tracking), capH = t.box.y2 - t.box.y1;
  // The cap is clipped to the letters, so a theme never changes the art's size.
  const ow = size * outline, dz = size * depth, pad = ow + 2;
  const ox = pad - t.box.x1, oy = pad - t.box.y1;
  const width = t.box.x2 - t.box.x1 + pad * 2, height = capH + dz + pad * 2;
  const g = id("af"), face = `${g}-face`, hi = `${g}-hi`, clip = `${g}-clip`, cap = `${g}-cap`, capGrad = `${g}-capg`;
  // The extrusion: the face, its copy dz lower, and every edge swept between them.
  const sides = sweep(t.glyphs.flatMap((gl) => gl.cmds), dz);
  const rand = rng(seed);
  const caps = theme?.cap ? t.glyphs.map((gl) => theme.cap!(gl.box, capH, rand)).join("") : "";
  const [c0, c1, c2] = theme?.capFill ?? ["#fff", "#fff", "#ccc"];
  const svg = `<defs>` +
    `<path id="${g}-t" d="${t.d}"/><path id="${g}-s" d="${sides}"/>` +
    `<linearGradient id="${face}" x1="0" y1="${f(t.box.y1)}" x2="0" y2="${f(t.box.y2)}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${A["gold-light"]}"/><stop offset="0.38" stop-color="${A.gold}"/><stop offset="1" stop-color="${A["gold-deep"]}"/></linearGradient>` +
    `<linearGradient id="${hi}" x1="0" y1="${f(t.box.y1)}" x2="0" y2="${f(t.box.y1 + capH * 0.4)}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="${clip}"><use href="#${g}-t"/></clipPath>` +
    (caps ? `<linearGradient id="${capGrad}" x1="0" y1="${f(t.box.y1 - capH * 0.25)}" x2="0" y2="${f(t.box.y1 + capH * 0.4)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c0}"/><stop offset="0.7" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
      `<clipPath id="${cap}"><use href="#${g}-t"/></clipPath>` : "") +
    `</defs><g transform="translate(${f(ox)} ${f(oy)})">` +
    // Outline: the whole solid (face, sides, bottom) stroked wide in ink, round joins.
    `<g fill="${A.ink}" stroke="${A.ink}" stroke-width="${f(ow * 2)}" stroke-linejoin="round" stroke-linecap="round"><use href="#${g}-t"/><use href="#${g}-s"/><use href="#${g}-t" y="${f(dz)}"/></g>` +
    // The solid in bronze, a hairline stroke closing the seams between its parts.
    `<g fill="${A["bronze-dark"]}" stroke="${A["bronze-dark"]}" stroke-width="${f(size * 0.004)}" stroke-linejoin="round"><use href="#${g}-t" y="${f(dz)}"/><use href="#${g}-s"/></g>` +
    `<use href="#${g}-t" y="${f(dz * 0.35)}" fill="${A.bronze}"/>` +
    `<use href="#${g}-t" fill="url(#${face})"/>` +
    // Light along the top edges: the face's own outline, faded out below.
    `<g clip-path="url(#${clip})"><use href="#${g}-t" fill="none" stroke="url(#${hi})" stroke-width="${f(size * 0.035)}"/></g>` +
    (caps ? `<g clip-path="url(#${cap})"><path d="${caps}" transform="translate(0 ${f(capH * 0.04)})" fill="${c2}"/><path d="${caps}" fill="url(#${capGrad})"/></g>` : "") +
    `</g>`;
  return { svg, width, height };
}

/** Art centred on (cx, cy), `w` wide. */
const place = (art: Metal, cx: number, cy: number, w: number) => {
  const s = w / art.width;
  return `<g transform="translate(${f(cx - w / 2)} ${f(cy - (art.height * s) / 2)}) scale(${+s.toFixed(5)})">${art.svg}</g>`;
};

/**
 * The icon: the A on a raised sky tile with a soft glow from above, 6/32 corners
 * like the other products. The A is sized to clear Discord's circle crop and to
 * read in the 64px Minecraft server list. Small sizes get a heavier outline.
 */
function icon(font: Font, size: number, { theme, radius = (size * 6) / 32 }: { theme?: Theme; radius?: number } = {}) {
  const small = size <= 64;
  const a = metal(font, "A", 600, { tracking: 0, theme, seed: 5, outline: small ? 0.085 : 0.06, depth: small ? 0.1 : 0.085 });
  const gid = id("afglow"), clip = id("afclip");
  const glows = theme?.glow ?? [[A.gold, 0.16], ["#6B7BD6", 0.08]];
  const bg = theme ? theme.colors.navy ?? theme.sky : A["sky-raised"];
  // The A's ink is taller than wide; fit its height to 60% of the tile (84% at
  // 64px and below), so it clears Discord's circle crop.
  const w = (size * (small ? 0.84 : 0.6) * a.width) / a.height;
  // The rim runs from one rounded side of the tile to the other: where the limb
  // meets the corner's curve, found by stepping in from the edge.
  const r = size * 1.9, cy = size * 2.74, limbY = (x: number) => cy - Math.sqrt(r * r - (x - size / 2) ** 2);
  const inside = (x: number, y: number) => {
    const cx = Math.min(Math.max(x, radius), size - radius), cyy = Math.min(Math.max(y, radius), size - radius);
    return Math.hypot(x - cx, y - cyy) <= radius - size * 0.006;
  };
  let x0 = 0;
  while (x0 < size / 2 && !inside(x0, limbY(x0))) x0 += 0.25;
  const limb = `M${f(x0)} ${f(limbY(x0))}A${f(r)} ${f(r)} 0 0 1 ${f(size - x0)} ${f(limbY(x0))}`;
  return svgDoc(size, size,
    `<defs><clipPath id="${clip}"><rect width="${size}" height="${size}" rx="${f(radius)}"/></clipPath>` +
    `<radialGradient id="${gid}" cx="0.5" cy="0.18" r="0.85">${glows.map(([c, o], i) => `<stop offset="${f(i * 0.5)}" stop-color="${c}" stop-opacity="${o}"/>`).join("")}<stop offset="1" stop-color="${glows.at(-1)![0]}" stop-opacity="0"/></radialGradient></defs>` +
    `<g clip-path="url(#${clip})"><rect width="${size}" height="${size}" fill="${bg}"/><rect width="${size}" height="${size}" fill="url(#${gid})"/>` +
    // The horizon, small: a planet's limb low across the tile, where the A stands.
    // The limb's crest sits just under the A's feet, so the rim runs edge to edge.
    (small ? "" : `<circle cx="${f(size * 0.5)}" cy="${f(cy)}" r="${f(r)}" fill="${theme ? theme.body : A.sky}"/>`) + `</g>` +
    // The rim as an open arc drawn outside the tile's clip, ending inside its
    // rounded corners: resvg drops half of a long stroke inside a rounded clip.
    (small ? "" : `<path d="${limb}" fill="none" stroke="${theme?.rim ?? A.gold}" stroke-width="${f(size * 0.03)}" stroke-linecap="round" opacity="0.18"/>` +
      `<path d="${limb}" fill="none" stroke="${theme?.rim ?? A.gold}" stroke-width="${f(size * 0.007)}" stroke-linecap="round" opacity="0.9"/>`) +
    place(a, size / 2, size * (small ? 0.5 : 0.45), w));
}

// ---------------------------------------------------------------- the horizon

// Xena's horizon in Airfields' colours: a flat sky and one huge planet arcing
// across the bottom, its limb in gold (or the theme's rim).
function horizon(w: number, h: number, { sky = A.sky, body = A["sky-raised"], rim = A.gold } = {}) {
  const cx = w * 0.7, r = w * 1.25, top = h * 0.8, cy = top + r, g = id("aflimb"), b = id("afblur");
  return `<defs><linearGradient id="${g}" x1="0" y1="${f(top)}" x2="0" y2="${f(top + h * 0.5)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${body}"/><stop offset="1" stop-color="${sky}"/></linearGradient>` +
    `<filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(h * 0.035)}"/></filter></defs>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${rim}" stroke-width="${f(h * 0.05)}" opacity="0.22" filter="url(#${b})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${g})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${rim}" stroke-width="1.5" opacity="0.7"/>`;
}

// ---------------------------------------------------------------- build

const ROOT = path.resolve(import.meta.dirname, "..");
const FONT_DIR = path.join(os.homedir(), "Library/Fonts");

function load(file: string): Font {
  if (!fs.existsSync(file)) {
    console.error(`Missing font: ${file}\nSee docs/building.md for where each font comes from, or set its path with the env var.`);
    process.exit(1);
  }
  const b = fs.readFileSync(file);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
}

/** XENA STUDIOS from the outlined logo (logo/xena-studios.svg), ink top-left at (x, y), `cap` tall. */
function endorsement(x: number, y: number, cap: number, fill: string) {
  const svg = fs.readFileSync(path.join(ROOT, "logo/xena-studios.svg"), "utf8");
  // logoFile draws it at cap height 100 with 50 of clear space on every side.
  const d = svg.match(/ d="([^"]+)"/)![1], k = cap / 100;
  return `<path transform="translate(${f(x - 50 * k)} ${f(y - 50 * k)}) scale(${+k.toFixed(5)})" d="${d}" fill="${fill}"/>`;
}

/** Writes everything in airfields/ and tokens/airfields.*. */
export function buildAirfields(out: Out) {
  const display = load(process.env.UNBOUNDED ?? path.join(ROOT, ".local-fonts/Unbounded-900.woff"));
  const sans = load(process.env.FIGTREE ?? path.join(ROOT, ".local-fonts/Figtree-700.woff"));
  const mono = load(process.env.MONO ?? path.join(FONT_DIR, "JetBrainsMono-Regular.ttf"));

  const wordmark = (theme?: Theme) => metal(display, "AIRFIELDS", 200, { theme, seed: 11 });
  const mark = (theme?: Theme) => metal(display, "A", 600, { tracking: 0, theme, seed: 5 });
  // Transparent exports with clear space of half the cap height on every side.
  const file = (art: Metal, pad: number) => svgDoc(art.width + pad * 2, art.height + pad * 2, `<g transform="translate(${f(pad)} ${f(pad)})">${art.svg}</g>`);

  // Banner in the products' layout: XENA STUDIOS top-left, the // kicker top-right,
  // the wordmark and the tagline in Figtree over the horizon.
  const banner = (theme: Theme | undefined, w = 1920, h = 600, s = w / 1920) => {
    const dy = (h - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
    const sky = theme?.sky ?? A.sky, rand = rng(42);
    let body = `<rect width="${w}" height="${h}" fill="${sky}"/>`;
    if (theme) {
      const glow = id("afsky");
      body += `<defs><radialGradient id="${glow}" cx="0.5" cy="0.1" r="0.9">${theme.glow.map(([c, o], i) => `<stop offset="${f(i * 0.45)}" stop-color="${c}" stop-opacity="${f(o * 0.6)}"/>`).join("")}<stop offset="1" stop-color="${sky}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#${glow})"/>`;
      body += theme.scenery?.(w, h, rand) ?? "";
    }
    body += horizon(w, h, theme ? { sky, body: theme.body, rim: theme.rim } : {});
    body += endorsement(m, Y(98), 14 * s, A.text);
    body += text(mono, airfields.kicker, { size: 17 * s, tracking: 0.18, fill: theme ? A.text : A.muted, x: w - m, y: Y(111), anchor: "end" }).svg;
    const wm = wordmark(theme), ww = 1040 * s, halo = id("afhalo");
    // Warm light behind the wordmark, as if the gold were lit.
    body += `<defs><radialGradient id="${halo}"><stop offset="0" stop-color="${A.gold}" stop-opacity="0.16"/><stop offset="1" stop-color="${A.gold}" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse cx="${f(w / 2)}" cy="${f(Y(300))}" rx="${f(ww * 0.62)}" ry="${f(150 * s)}" fill="url(#${halo})"/>`;
    body += place(wm, w / 2, Y(300), ww);
    body += text(sans, airfields.tagline, { size: 40 * s, tracking: 0, fill: A.text, x: w / 2, y: Y(300) + (ww * wm.height) / wm.width / 2 + 64 * s, anchor: "middle" }).svg;
    return svgDoc(w, h, body);
  };

  out("airfields/wordmark.svg", file(wordmark(), 30), 2400);
  out("airfields/monogram.svg", file(mark(), 90), 1024);
  out("airfields/icon.svg", icon(display, 512), 1024);
  // The favicon and the Minecraft server list's server-icon.png (exactly 64×64).
  out("airfields/favicon.svg", icon(display, 64, { radius: 12 }), 64);
  out("airfields/server-icon.svg", icon(display, 64, { radius: 0 }), 64);
  out("airfields/banner.svg", banner(undefined), 3840);
  out("airfields/social.svg", banner(undefined, 1280, 640, 0.9), 1280);

  for (const t of themes) {
    out(`airfields/themes/${t.id}/wordmark.svg`, file(wordmark(t), 30), 2400);
    out(`airfields/themes/${t.id}/monogram.svg`, file(mark(t), 90), 1024);
    out(`airfields/themes/${t.id}/icon.svg`, icon(display, 512, { theme: t }), 1024);
    out(`airfields/themes/${t.id}/server-icon.svg`, icon(display, 64, { theme: t, radius: 0 }), 64);
    out(`airfields/themes/${t.id}/banner.svg`, banner(t), 3840);
    out(`airfields/themes/${t.id}/social.svg`, banner(t, 1280, 640, 0.9), 1280);
    fs.writeFileSync(path.join(ROOT, `airfields/themes/${t.id}/colors.json`), JSON.stringify(t.colors, null, 2) + "\n");
  }

  fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tokens/airfields.json"), JSON.stringify(A, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "tokens/airfields.css"), `:root {\n${Object.entries(A).map(([k, v]) => `  --airfields-${k}: ${v};`).join("\n")}\n}\n`);
}

// `pnpm build:airfields`: just these files, without the fonts the rest of the build needs.
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const written: string[] = [];
  buildAirfields(writer(ROOT, written));
  console.log(`wrote ${written.length} airfields svgs (+png)`);
}
