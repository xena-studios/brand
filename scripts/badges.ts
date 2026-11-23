// Xena's badges: the row of "Available on Modrinth", "Runs on Folia", "Read the Docs" tiles
// under a README's or Modrinth page's tagline. One layout for every brand, drawn in each
// brand's own colours, as the banners are:
//
//   - a tile in the brand's background, with a border in its rule colour;
//   - the logo in the brand's accent, the only colour on it;
//   - a JetBrains Mono `//` kicker in the muted colour over the name in the text colour
//     (cozy), or the two on one line (compact);
//   - on cozy, the horizon along the bottom: a planet arcing in the brand's raised colour
//     with its rim in the accent, stepped into pixels for the plugins.
//
// Themes: the studio (Ion Blue), NeoSkript, Raptor, and each plugin in its own accent.
// Written to badges/<theme>/<style>/<badge>.svg (+png), with each plugin's under
// badges/plugins/<id>/. docs/badges.md says which go where.
//
// Runs as part of `pnpm build`, or on its own with `pnpm build:badges`, which needs only
// JetBrains Mono (docs/building.md).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import opentype, { type Font, type PathCommand } from "opentype.js";
import { writer, type Out } from "./output.ts";
import { icons } from "./badge-icons.ts";
import { pluginColors as PC, plugins } from "./plugin-brand.ts";
import { neoskriptColors as NS } from "./neoskript-brand.ts";
import { readable } from "./color.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const FONT_DIR = path.join(os.homedir(), "Library/Fonts");

// ---------------------------------------------------------------- badges

export interface Badge {
  // The kicker: what the link does ("Available on"). Drawn uppercase after `//` on cozy.
  kicker: string;
  // The name: where it goes.
  title: string;
  // SVG markup in a 40×40 box, icon inside 6..34, with {c} for its colour.
  icon: string;
}

// The 24-unit icons drawn here, fitted into the 40-unit box the library's use.
const in40 = (d: string) => `<path fill="{c}" transform="translate(6 6) scale(1.1667)" d="${d}"/>`;

export const badges: Record<string, Badge> = {
  modrinth: { kicker: "Available on", title: "Modrinth", icon: icons.modrinth },
  github: { kicker: "Available on", title: "GitHub", icon: icons.github },
  paper: { kicker: "Runs on", title: "Paper", icon: icons.paper },
  purpur: { kicker: "Runs on", title: "Purpur", icon: icons.purpur },
  // Folia's leaf, from PaperMC's site (github.com/PaperMC/website, src/assets/brand/folia.svg,
  // MIT), which draws it from Material Design Icons' "leaf" (Apache 2.0).
  folia: {
    kicker: "Runs on",
    title: "Folia",
    icon: in40("M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z"),
  },
  // An open book, drawn here: two pages with the spine between them.
  docs: {
    kicker: "Read the",
    title: "Docs",
    icon: in40("M2 5.5C2 4.7 2.6 4 3.5 4L9 4C10.7 4 11.5 5 11.5 6.2L11.5 21C11.5 19.9 10.6 19 9.5 19L3.5 19C2.6 19 2 18.4 2 17.5Z" +
      "M22 5.5C22 4.7 21.4 4 20.5 4L15 4C13.3 4 12.5 5 12.5 6.2L12.5 21C12.5 19.9 13.4 19 14.5 19L20.5 19C21.4 19 22 18.4 22 17.5Z"),
  },
  website: { kicker: "Visit the", title: "Website", icon: icons.website },
  discord: { kicker: "Chat on", title: "Discord", icon: icons.discord },
};

// ---------------------------------------------------------------- themes

export interface Theme {
  bg: string;       // the tile
  raised: string;   // the planet
  rule: string;     // the border
  text: string;     // the name
  muted: string;    // the kicker
  accent: string;   // the logo and the horizon's rim
  stepped?: boolean; // the plugins' pixel-stepped horizon
}

const token = (file: string) => JSON.parse(fs.readFileSync(path.join(ROOT, "tokens", file), "utf8"));
const hex = (v: string | { hex: string }) => (typeof v === "string" ? v : v.hex);

export function themes(): Record<string, Theme> {
  const X = token("colors.json"), R = token("raptor.json");
  return {
    xena: { bg: X.space, raised: X.surface, rule: X.line, text: X.text, muted: X.muted, accent: X.accent },
    neoskript: { bg: NS.night, raised: NS["night-raised"], rule: NS["night-rule"], text: NS.text, muted: NS.muted, accent: NS.magenta },
    raptor: { bg: hex(R.ink), raised: hex(R["ink-raised"]), rule: hex(R["ink-rule"]), text: hex(R.bone), muted: hex(R.ash), accent: hex(R["signal-red"]) },
    ...Object.fromEntries(plugins.map((p) => [
      `plugins/${p.id}`,
      // The accent as the docs show it as text: a darker one is lifted until it reads.
      { bg: PC.bg, raised: PC.raised, rule: PC.rule, text: PC.text, muted: PC.muted, accent: readable(p.accent, PC.bg), stepped: true },
    ])),
  };
}

// ---------------------------------------------------------------- type

const f = (n: number) => +n.toFixed(2);

// `str` as outlines from the pen position (x, baseline). Each glyph is drawn at the origin and
// moved here: opentype.js emits NaN for some TrueType glyphs drawn at fractional offsets.
function text(font: Font, str: string, size: number, x: number, baseline: number, fill: string, tracking = 0) {
  const scale = size / font.unitsPerEm;
  let cx = x, d = "";
  const glyphs = [...str].map((c) => font.charToGlyph(c));
  glyphs.forEach((g, i) => {
    const X = (v: number) => f(v + cx), Y = (v: number) => f(v + baseline);
    for (const c of g.getPath(0, 0, size).commands as PathCommand[]) {
      d += c.type === "Z" ? "Z" :
        c.type === "Q" ? `Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}` :
        c.type === "C" ? `C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}` :
        `${c.type}${X(c.x)} ${Y(c.y)}`;
    }
    cx += g.advanceWidth * scale;
    if (i < glyphs.length - 1) cx += tracking * size;
  });
  return { svg: d ? `<path fill="${fill}" d="${d}"/>` : "", right: cx };
}

// ---------------------------------------------------------------- drawing

type Style = "cozy" | "compact";
export const STYLES: Style[] = ["cozy", "compact"];

interface Fonts { regular: Font; semi: Font }

// The horizon along a cozy badge's bottom: a planet far wider than the badge, so only a
// shallow arc shows, its top `rise` above the bottom edge in the middle.
function horizon(w: number, h: number, t: Theme) {
  const rise = 7, R = w * 1.6, cx = w / 2, cy = h - rise + R;
  const y = (x: number) => cy - Math.sqrt(R * R - (x - cx) ** 2);
  let svg = `<rect width="${w}" height="${h}" fill="url(#glow)"/>`;
  if (t.stepped) {
    // Two-pixel steps, as the plugin banners step their rim.
    const step = 2;
    for (let x = 0; x < w; x += step) {
      const top = f(Math.round(y(x + step / 2) * 2) / 2);
      svg += `<rect x="${x}" y="${top}" width="${step}" height="${f(h - top)}" fill="${t.raised}"/><rect x="${x}" y="${top}" width="${step}" height="1" fill="${t.accent}" fill-opacity=".7"/>`;
    }
  } else {
    svg += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="${t.raised}" stroke="${t.accent}" stroke-opacity=".6"/>`;
  }
  return svg;
}

function badge(b: Badge, t: Theme, style: Style, fonts: Fonts) {
  const cozy = style === "cozy";
  const h = cozy ? 48 : 32, radius = cozy ? 6 : 5;
  let words = "", w: number;
  if (cozy) {
    const kicker = text(fonts.regular, `// ${b.kicker.toUpperCase()}`, 9, 50, 20, t.muted, 0.08);
    const title = text(fonts.semi, b.title, 15, 50, 37, t.text);
    words = kicker.svg + title.svg;
    w = Math.ceil(Math.max(kicker.right, title.right) + 14);
  } else {
    const kicker = text(fonts.regular, b.kicker.toLowerCase(), 12, 36, 20.5, t.muted);
    const title = text(fonts.semi, b.title, 12, kicker.right + 7, 20.5, t.text);
    words = kicker.svg + title.svg;
    w = Math.ceil(title.right + 11);
  }
  // The logo: its 40-unit box scaled to 32 (cozy) or 24 (compact), centred on the left.
  const s = cozy ? 0.8 : 0.6, inset = (h - 40 * s) / 2;
  const logo = `<g transform="translate(${f(cozy ? 8 : 6)} ${f(inset)}) scale(${s})">${b.icon.replaceAll("{c}", t.accent)}</g>`;
  const ground = cozy ? horizon(w, h, t) : `<rect y="${h - 1.5}" width="${w}" height="1.5" fill="${t.accent}" fill-opacity=".6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" fill="none" viewBox="0 0 ${w} ${h}">` +
    `<defs><clipPath id="tile"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>` +
    `<radialGradient id="glow" cx="0.5" cy="1" r="0.9"><stop offset="0" stop-color="${t.accent}" stop-opacity=".2"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient></defs>` +
    `<g clip-path="url(#tile)"><rect width="${w}" height="${h}" fill="${t.bg}"/>${ground}</g>` +
    `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${radius - 0.5}" stroke="${t.rule}"/>` +
    logo + words + `</svg>`;
}

// ---------------------------------------------------------------- output

const loadFont = (p: string): Font => {
  if (!fs.existsSync(p)) {
    console.error(`Missing font: ${p}\nSee docs/building.md for where each font comes from, or set its path with the env var.`);
    process.exit(1);
  }
  const b = fs.readFileSync(p);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
};

export function buildBadges(out: Out) {
  const fonts = {
    regular: loadFont(process.env.MONO ?? path.join(FONT_DIR, "JetBrainsMono-Regular.ttf")),
    semi: loadFont(process.env.MONO_SEMIBOLD ?? path.join(FONT_DIR, "JetBrainsMono-SemiBold.ttf")),
  };
  for (const [dir, theme] of Object.entries(themes())) {
    for (const style of STYLES) {
      for (const [name, b] of Object.entries(badges)) {
        const svg = badge(b, theme, style, fonts);
        // PNGs at twice the size, sharp on high-density screens.
        out(`badges/${dir}/${style}/${name}.svg`, svg, Number(svg.match(/width="(\d+)"/)![1]) * 2);
      }
    }
  }
}

// `pnpm build:badges`: just the badges, with only JetBrains Mono.
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const written: string[] = [];
  buildBadges(writer(ROOT, written));
  console.log(`wrote ${written.length} badge svgs (+png)`);
}
