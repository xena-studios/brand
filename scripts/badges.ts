// Badges in the style of Devin's Badges (github.com/intergrav/devins-badges, CC0), for
// what that library doesn't have. Our READMEs and Modrinth pages use its badges straight
// from jsDelivr; the ones drawn here sit in the same row, so they copy its look exactly:
// the dark tile with a faint white rim, a white icon on the left, and Inter type, a
// Regular label over (cozy) or beside (compact) a Bold name, all with the same soft
// shadow. Each badge comes in the library's four styles, at its sizes, and is written to
// badges/<style>/<category>/<name>.svg (+png). docs/badges.md says where each one goes.
//
// Runs as part of `pnpm build`, or on its own with `pnpm build:badges`, which needs only
// Inter (docs/building.md).
import fs from "node:fs";
import path from "node:path";
import opentype, { type Font, type PathCommand } from "opentype.js";
import { writer, type Out } from "./output.ts";

const ROOT = path.resolve(import.meta.dirname, "..");

export interface Badge {
  // badges/<style>/<category>/<name>: the library's categories, such as supported or available.
  category: "available" | "supported" | "built-with" | "documentation" | "social";
  name: string;
  // The grey line, as the library words it for the category ("Available for" Paper).
  label: string;
  // The white line: the product's name.
  title: string;
  // The icon: SVG path data in a square box `box` units wide, drawn in white. `scale`
  // shrinks a heavy one (a solid, wide shape) so it weighs the same as the library's.
  icon: { d: string; box: number; scale?: number };
  // Why we draw it rather than take the library's.
  why: string;
}

export const badges: Badge[] = [
  {
    category: "supported",
    name: "folia",
    label: "Available for",
    title: "Folia",
    // Folia's leaf, from PaperMC's site (github.com/PaperMC/website, src/assets/brand/folia.svg,
    // MIT), which draws it from Material Design Icons' "leaf" (Apache 2.0).
    icon: {
      d: "M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z",
      box: 24,
    },
    why: "Devin's Badges has Paper, Purpur, Spigot, Bukkit and Velocity, but no Folia, and most of our plugins and NeoSkript run on it.",
  },
  {
    category: "documentation",
    name: "docs",
    label: "Read the",
    title: "Docs",
    // An open book, drawn here: two pages with the spine between them.
    icon: {
      d: "M3 5C3 4.4 3.4 4 4 4L9 4C10.7 4 11.5 4.9 11.5 6L11.5 20C11.5 19 10.7 18.5 9.5 18.5L4 18.5C3.4 18.5 3 18.1 3 17.5Z" +
        "M21 5C21 4.4 20.6 4 20 4L15 4C13.3 4 12.5 4.9 12.5 6L12.5 20C12.5 19 13.3 18.5 14.5 18.5L20 18.5C20.6 18.5 21 18.1 21 17.5Z",
      box: 24,
      scale: 0.82,
    },
    why: "The library's documentation badges are for GitBook, Read the Docs (the service) and a generic \"Visit the Website\". Our plugins' docs are their own site, so this says what the link is.",
  },
];

// ---------------------------------------------------------------- the library's look

// Measured from the library's v3 SVGs (supported/paper, supported/purpur), so ours line up
// with theirs in one row.
const LOOK = {
  bg: ["#1D262D", "#12181C"],   // the tile, top to bottom
  label: "#E8E8E8",
  title: "#FFFFFF",
  shadow: 0.25,                 // black, no offset
  tracking: 0.01,               // em: Figma's Inter sets a touch wider than Inter 3.19's
};

type Style = "cozy" | "compact" | "cozy-minimal" | "compact-minimal";
export const STYLES: Style[] = ["cozy", "compact", "cozy-minimal", "compact-minimal"];

interface Geometry {
  h: number;
  radius: number;
  rim: number;           // the rim's stroke width
  blur: number;          // the shadow's standard deviation
  icon: { cx: number; ink: number };  // the icon's ink centre (x; y is mid-height) and its larger side
  label?: { size: number; x: number; top: number };  // ink left and ink top
  title?: { size: number; top: number };  // cozy: under the label, from its pen position; compact: after it
  gap?: number;          // compact: ink gap from label to title
  pad: number;           // ink right to the tile's edge
}

const GEOMETRY: Record<Style, Geometry> = {
  cozy: { h: 56, radius: 8, rim: 2.1, blur: 2.857, icon: { cx: 31, ink: 35 }, label: { size: 16, x: 60.4, top: 12.32 }, title: { size: 17, top: 31.14 }, pad: 13.25 },
  compact: { h: 40, radius: 8, rim: 2.143, blur: 2.8, icon: { cx: 21, ink: 24 }, label: { size: 17, x: 42.42, top: 13.56 }, title: { size: 17, top: 14.14 }, gap: 5.33, pad: 8.27 },
  "cozy-minimal": { h: 56, radius: 8.4, rim: 2.1, blur: 2.857, icon: { cx: 28, ink: 35 }, pad: 0 },
  "compact-minimal": { h: 40, radius: 8, rim: 2.1, blur: 2, icon: { cx: 20, ink: 24 }, pad: 0 },
};

// ---------------------------------------------------------------- type

const f = (n: number) => +n.toFixed(2);

const pathData = (cmds: PathCommand[]) => cmds.map((c) =>
  c.type === "Z" ? "Z" :
  c.type === "Q" ? `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}` :
  c.type === "C" ? `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}` :
  `${c.type}${f(c.x)} ${f(c.y)}`).join("");

// `str` as outlines, from the pen position (x, baseline), and its ink's left and right.
function text(font: Font, str: string, size: number, x: number, baseline: number) {
  const glyphs = [...str].map((c) => font.charToGlyph(c));
  const scale = size / font.unitsPerEm;
  const p = new opentype.Path();
  let cx = x;
  glyphs.forEach((g, i) => {
    for (const c of g.getPath(0, 0, size).commands) {
      const t: Record<string, string | number> = { ...c };
      for (const k of ["x", "x1", "x2"]) if (typeof t[k] === "number") t[k] += cx;
      for (const k of ["y", "y1", "y2"]) if (typeof t[k] === "number") t[k] += baseline;
      p.commands.push(t as PathCommand);
    }
    cx += g.advanceWidth * scale;
    if (i < glyphs.length - 1) cx += font.getKerningValue(g, glyphs[i + 1]) * scale + LOOK.tracking * size;
  });
  const bb = p.getBoundingBox();
  return { d: pathData(p.commands), left: bb.x1, top: bb.y1, right: bb.x2 };
}

// The library's text boxes, from where its "Available for" and "Paper" put their ink: the
// pen position and baseline that land that ink there. Laid out from these, other words sit
// where the library's own would, whatever their first letter or tallest one.
function anchor(font: Font, ref: string, size: number, inkX: number, inkTop: number) {
  const t = text(font, ref, size, 0, 0);
  return { x: inkX - t.left, baseline: inkTop - t.top };
}

// ---------------------------------------------------------------- drawing

function badge(b: Badge, style: Style, fonts: { regular: Font; bold: Font }) {
  const g = GEOMETRY[style];
  let body = "", w = g.h;
  if (g.label && g.title) {
    const at = anchor(fonts.regular, "Available for", g.label.size, g.label.x, g.label.top);
    const label = text(fonts.regular, b.label, g.label.size, at.x, at.baseline);
    const ref = anchor(fonts.bold, "Paper", g.title.size, g.gap === undefined ? g.label.x : 0, g.title.top);
    // Cozy: under the label, from the same pen position. Compact: after it, a gap on.
    const titleX = g.gap === undefined ? ref.x : label.right + g.gap - (text(fonts.bold, b.title, g.title.size, 0, 0).left);
    const title = text(fonts.bold, b.title, g.title.size, g.gap === undefined ? at.x : titleX, ref.baseline);
    body = `<g filter="url(#shadow)"><path fill="${LOOK.label}" d="${label.d}"/><path fill="${LOOK.title}" d="${title.d}"/></g>`;
    w = Math.ceil(Math.max(label.right, title.right) + g.pad);
  }
  // The icon, scaled so its ink's larger side is g.icon.ink, centred on (cx, h / 2). Its
  // ink box is measured from the path itself, since icon sets pad their boxes differently.
  const ink = new opentype.Path();
  ink.commands = parsePath(b.icon.d);
  const bb = ink.getBoundingBox();
  const s = (g.icon.ink * (b.icon.scale ?? 1)) / Math.max(bb.x2 - bb.x1, bb.y2 - bb.y1);
  const tx = g.icon.cx - ((bb.x1 + bb.x2) / 2) * s, ty = g.h / 2 - ((bb.y1 + bb.y2) / 2) * s;
  const icon = `<g filter="url(#shadow)"><path fill="#FFFFFF" transform="translate(${f(tx)} ${f(ty)}) scale(${f(s)})" d="${b.icon.d}"/></g>`;
  const half = g.rim / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${g.h}" fill="none" viewBox="0 0 ${w} ${g.h}">` +
    `<defs><linearGradient id="tile" x1="0" y1="0" x2="0" y2="${g.h}" gradientUnits="userSpaceOnUse"><stop stop-color="${LOOK.bg[0]}"/><stop offset="1" stop-color="${LOOK.bg[1]}"/></linearGradient>` +
    `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${g.blur}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${LOOK.shadow} 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
    `<rect width="${w}" height="${g.h}" fill="url(#tile)" rx="${g.radius}"/>` +
    `<rect width="${f(w - g.rim)}" height="${f(g.h - g.rim)}" x="${half}" y="${half}" stroke="#FFFFFF" stroke-opacity=".15" stroke-width="${g.rim}" rx="${f(g.radius - half)}"/>` +
    icon + body + `</svg>`;
}

// Absolute M/L/C/Q/Z path data (all the icons use) as commands, to measure the ink.
function parsePath(d: string): PathCommand[] {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const cmds: PathCommand[] = [];
  let i = 0, op = "";
  const n = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Z]/i.test(tokens[i])) op = tokens[i++].toUpperCase();
    if (op === "Z") { cmds.push({ type: "Z" }); continue; }
    if (op === "M") { cmds.push({ type: "M", x: n(), y: n() }); op = "L"; }
    else if (op === "L") cmds.push({ type: "L", x: n(), y: n() });
    else if (op === "Q") cmds.push({ type: "Q", x1: n(), y1: n(), x: n(), y: n() });
    else if (op === "C") cmds.push({ type: "C", x1: n(), y1: n(), x2: n(), y2: n(), x: n(), y: n() });
    else throw new Error(`badges: path command ${op} isn't supported; use absolute M, L, C, Q and Z`);
  }
  return cmds;
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
    regular: loadFont(process.env.INTER ?? path.join(ROOT, ".local-fonts/Inter-Regular.otf")),
    bold: loadFont(process.env.INTER_BOLD ?? path.join(ROOT, ".local-fonts/Inter-Bold.otf")),
  };
  for (const b of badges) {
    for (const style of STYLES) {
      const svg = badge(b, style, fonts);
      const w = Number(svg.match(/width="(\d+)"/)![1]);
      // PNGs at twice the size, sharp on high-density screens: 112px tall for cozy, 80 for compact.
      out(`badges/${style}/${b.category}/${b.name}.svg`, svg, w * 2);
    }
  }
}

// `pnpm build:badges`: just the badges, with only Inter.
if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const written: string[] = [];
  buildBadges(writer(ROOT, written));
  console.log(`wrote ${written.length} badge svgs (+png)`);
}
