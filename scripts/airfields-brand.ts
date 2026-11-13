// Airfields: Xena's sky-mining PvP Minecraft server. A product with its own
// identity, like Raptor, NeoSkript and MostWanted; Xena supplies only the horizon
// and the XENA STUDIOS endorsement.
//
// The permanent brand is drawn here: the AIRFIELDS wordmark and the AF monogram
// in block title lettering (scripts/airfields-logo.ts: gold faces, bevels, a brown
// extrusion and a maroon outline), and the icons made from the monogram. Seasons
// dress it up without changing it: each theme in `themes` may cut an emblem into the
// A (winter keeps it plain), brings its own sky, and may have a pixel scene
// (scripts/airfields-scene.ts); it's written to airfields/themes/<id>/. The game
// repo (xena-studios/airfields, brand/) syncs these files.
//
// Runs as part of `pnpm build`, or on its own with `pnpm build:airfields`, which
// needs only Figtree and JetBrains Mono (docs/building.md).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import opentype, { type Font, type PathCommand, type BoundingBox } from "opentype.js";
import { lettering, logoColors, type Rect, type Lettering } from "./airfields-logo.ts";
import { buildAirfieldsScene, scenePng, SCENE_W, SCENE_H, BANNER_CROP } from "./airfields-scene.ts";
import { writer, type Out } from "./output.ts";

// Airfields Gold on a high-altitude night. The gold is pushed toward yellow
// (OKLCH hue 96) so it stays clear of the plugin family's amber (xUtilities, 81)
// and MostWanted's Desert Orange (60) and sand (87). Neutrals lean blue (hue 270),
// away from MostWanted's warm dusk.
export const airfieldsColors = {
  gold: "#FFD93D",              // Airfields Gold: the one accent
  "gold-daylight": "#7A5600",   // gold text on light backgrounds (6.2:1 on cloud)
  // Golds and browns for illustration, not text. The wordmark's own colours are
  // logoColors in airfields-logo.ts; the last two are its extrusion and outline.
  "gold-light": "#FFF3B0",
  "gold-deep": "#F0B312",
  bronze: "#A8700A",
  "bronze-dark": "#5A3A06",
  "title-extrusion": logoColors.extrusion,
  "title-outline": logoColors.outline,
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
// the emblem it cuts into the A. The marks' shape and gold never change.
export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  sky: string;
  body: string;
  rim: string;
  /** Glow behind the icon's monogram: [colour, opacity]. */
  glow: [string, number][];
  /** Cut into the A's face, in quarter-cells about its centre (airfields-logo.ts). */
  emblem?: Rect[];
  /** Has a pixel scene (airfields-scene.ts) for its key art and banners. */
  scene?: boolean;
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
    scene: true,
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
 * Cleans a glyph's outline. Some fonts close each contour with a line back to its
 * start before the Z; that zero-length last segment leaves a stroke with no join
 * there. And a small notch in an E's left side is straightened.
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

/** Plain text as one path, anchored by its ink. */
function text(font: Font, str: string, o: { x: number; y: number; size: number; tracking?: number; anchor?: "start" | "middle" | "end"; fill: string }) {
  const t = lay(font, str, o.size, o.tracking ?? 0);
  const w = t.box.x2 - t.box.x1, a = o.anchor ?? "start";
  const x = (a === "start" ? o.x : a === "end" ? o.x - w : o.x - w / 2) - t.box.x1;
  return { svg: `<path transform="translate(${f(x)} ${f(o.y)})" d="${t.d}" fill="${o.fill}"/>`, width: w };
}

// ---------------------------------------------------------------- the marks

type Metal = Lettering;

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
function icon(size: number, { theme, radius = (size * 6) / 32 }: { theme?: Theme; radius?: number } = {}) {
  const small = size <= 64;
  // Small icons drop the bevels and the emblem: flat gold on the extrusion reads
  // at 16–64px, where a bevel would only blur.
  const a = lettering("AF", 600, { emblem: theme?.emblem, plain: small, idPrefix: id("aficon") });
  const gid = id("afglow"), clip = id("afclip");
  const glows = theme?.glow ?? [[A.gold, 0.16], ["#6B7BD6", 0.08]];
  const bg = theme ? theme.colors.navy ?? theme.sky : A["sky-raised"];
  // AF is wider than tall: 74% of the tile clears Discord's circle crop; at 64px
  // and below it fills the tile.
  const w = size * (small ? 0.96 : 0.74);
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
    // The horizon, small: a planet's limb low across the tile, where AF stands.
    // The limb's crest sits just under its feet, so the rim runs edge to edge.
    (small ? "" : `<circle cx="${f(size * 0.5)}" cy="${f(cy)}" r="${f(r)}" fill="${theme ? theme.body : A.sky}"/>`) + `</g>` +
    // The rim as an open arc drawn outside the tile's clip, ending inside its
    // rounded corners: resvg drops half of a long stroke inside a rounded clip.
    (small ? "" : `<path d="${limb}" fill="none" stroke="${theme?.rim ?? A.gold}" stroke-width="${f(size * 0.03)}" stroke-linecap="round" opacity="0.18"/>` +
      `<path d="${limb}" fill="none" stroke="${theme?.rim ?? A.gold}" stroke-width="${f(size * 0.007)}" stroke-linecap="round" opacity="0.9"/>`) +
    place(a, size / 2, size * (small ? 0.5 : 0.46), w));
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
  const sans = load(process.env.FIGTREE ?? path.join(ROOT, ".local-fonts/Figtree-700.woff"));
  const mono = load(process.env.MONO ?? path.join(FONT_DIR, "JetBrainsMono-Regular.ttf"));

  const wordmark = (theme?: Theme) => lettering("AIRFIELDS", 200, { emblem: theme?.emblem, idPrefix: id("afwm") });
  const mark = (theme?: Theme) => lettering("AF", 600, { emblem: theme?.emblem, idPrefix: id("afmono") });
  // Transparent exports with clear space on every side.
  const file = (art: Metal, pad: number) => svgDoc(art.width + pad * 2, art.height + pad * 2, `<g transform="translate(${f(pad)} ${f(pad)})">${art.svg}</g>`);

  // Banner in the products' layout: XENA STUDIOS top-left, the // kicker top-right,
  // the wordmark and the tagline in Figtree over the horizon, or over the season's
  // pixel scene, blurred like the key art.
  const banner = (theme: Theme | undefined, w = 1920, h = 600, s = w / 1920) => {
    const dy = (h - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
    const sky = theme?.sky ?? A.sky, rand = rng(42);
    let body = `<rect width="${w}" height="${h}" fill="${sky}"/>`;
    if (theme?.scene) {
      // A band of the scene as wide as the banner, scaled up pixel for pixel, then
      // blurred; drawn 4% oversize so the blur never fades in from the edges.
      const ch = Math.min(SCENE_H, Math.round((SCENE_W * h) / w));
      const crop = { x: 0, y: Math.max(0, Math.min(SCENE_H - ch, BANNER_CROP.y + Math.round((BANNER_CROP.h - ch) / 2))), w: SCENE_W, h: ch };
      const blur = id("afsceneblur"), over = 0.04;
      body += `<defs><filter id="${blur}" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation="${f((w / SCENE_W) * 2.2)}"/></filter></defs>` +
        `<image x="${f(-w * over)}" y="${f(-h * over)}" width="${f(w * (1 + 2 * over))}" height="${f(h * (1 + 2 * over))}" preserveAspectRatio="none" image-rendering="optimizeSpeed" filter="url(#${blur})" href="data:image/png;base64,${scenePng(crop)}"/>` +
        `<rect width="${w}" height="${h}" fill="${sky}" opacity="0.28"/>`;
    } else if (theme) {
      const glow = id("afsky");
      body += `<defs><radialGradient id="${glow}" cx="0.5" cy="0.1" r="0.9">${theme.glow.map(([c, o], i) => `<stop offset="${f(i * 0.45)}" stop-color="${c}" stop-opacity="${f(o * 0.6)}"/>`).join("")}<stop offset="1" stop-color="${sky}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#${glow})"/>`;
      body += theme.scenery?.(w, h, rand) ?? "";
    }
    if (!theme?.scene) body += horizon(w, h, theme ? { sky, body: theme.body, rim: theme.rim } : {});
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
  out("airfields/icon.svg", icon(512), 1024);
  // The favicon and the Minecraft server list's server-icon.png (exactly 64×64).
  out("airfields/favicon.svg", icon(64, { radius: 12 }), 64);
  out("airfields/server-icon.svg", icon(64, { radius: 0 }), 64);
  out("airfields/banner.svg", banner(undefined), 3840);
  out("airfields/social.svg", banner(undefined, 1280, 640, 0.9), 1280);

  for (const t of themes) {
    out(`airfields/themes/${t.id}/wordmark.svg`, file(wordmark(t), 30), 2400);
    out(`airfields/themes/${t.id}/monogram.svg`, file(mark(t), 90), 1024);
    out(`airfields/themes/${t.id}/icon.svg`, icon(512, { theme: t }), 1024);
    out(`airfields/themes/${t.id}/server-icon.svg`, icon(64, { theme: t, radius: 0 }), 64);
    out(`airfields/themes/${t.id}/banner.svg`, banner(t), 3840);
    out(`airfields/themes/${t.id}/social.svg`, banner(t, 1280, 640, 0.9), 1280);
    fs.writeFileSync(path.join(ROOT, `airfields/themes/${t.id}/colors.json`), JSON.stringify(t.colors, null, 2) + "\n");
    // The pixel scene, its wide crop and the key art (over the wordmark just written).
    if (t.scene) buildAirfieldsScene(ROOT, t.id);
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
