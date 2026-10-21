// Generates every Xena Studios brand asset from code: logos, avatar, social
// graphics, Raptor's and NeoSkript's marks and banners, and the plugin family. All type is converted to outlines so no
// font file ever ships (Ethnocentric's desktop EULA forbids redistribution).
//
//   npm run build
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";
import { clawPath, raptorPath, wordmarkPath, raptorColors, lockup } from "./raptor-brand.mjs";
import { pluginColors as PC, plugins, glyphCells } from "./plugin-brand.mjs";
import { neoskriptColors as NS, neoskript, markText } from "./neoskript-brand.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const FONT_DIR = path.join(os.homedir(), "Library/Fonts");
const fontFile = (p) => {
  if (!fs.existsSync(p)) {
    console.error(`Missing font: ${p}\nSee "Build" in README.md for where each font comes from, or set its path with the env var.`);
    process.exit(1);
  }
  return opentype.parse(fs.readFileSync(p).buffer);
};

const display = fontFile(process.env.ETHNOCENTRIC ?? path.join(ROOT, ".local-fonts/Ethnocentric-Regular.otf"));
const mono = fontFile(process.env.MONO ?? path.join(FONT_DIR, "JetBrainsMono-Regular.ttf"));
const monoLight = fontFile(process.env.MONO_LIGHT ?? path.join(FONT_DIR, "JetBrainsMono-Light.ttf"));
// xenastudios.co's heading weight, for the studio's repo cards and the docs' link preview.
const monoSemi = fontFile(process.env.MONO_SEMIBOLD ?? path.join(FONT_DIR, "JetBrainsMono-SemiBold.ttf"));
// Raptor's sans (OFL), static 700 instance from Google Fonts.
const hankenBold = fontFile(process.env.HANKEN_BOLD ?? path.join(ROOT, ".local-fonts/HankenGrotesk-700.ttf"));
// The plugin family's sans (OFL), static Bold from github.com/floriankarsten/space-grotesk.
const groteskBold = fontFile(process.env.GROTESK_BOLD ?? path.join(ROOT, ".local-fonts/SpaceGrotesk-700.ttf"));
// NeoSkript's sans and code faces (OFL), static instances from github.com/vercel/geist-font.
const geistBold = fontFile(process.env.GEIST_BOLD ?? path.join(ROOT, ".local-fonts/Geist-700.ttf"));
const geistMono = fontFile(process.env.GEIST_MONO ?? path.join(ROOT, ".local-fonts/GeistMono-500.ttf"));

// ---------------------------------------------------------------- tokens

// Ion Blue on deep space.
export const C = {
  void: "#06080D", space: "#0A0E16", surface: "#121824", line: "#222B3B",
  muted: "#8A93A6", text: "#EDF1F7", accent: "#5CB4FF",
};

// oklch() → #rrggbb, so Raptor's DESIGN.md tokens render anywhere (resvg,
// image editors) while the oklch values stay the source of truth.
function oklchHex(v) {
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
const hexify = (svg) => svg.replace(/oklch\([^)]+\)/g, oklchHex);

// Raptor keeps its own identity (docs/DESIGN.md in xena-studios/raptor):
// Signal Red on warm Ink, the raptor + RAPTOR lockup, and the claw R.
const R = Object.fromEntries(Object.entries(raptorColors).map(([k, v]) => [k, oklchHex(v)]));
const raptor = {
  kicker: "// GAME SERVER PANEL",
  headline: ["Pterodactyl had ", "a good run."],
};

const ORG_TAGLINE = "Game server infrastructure, built in the open.";

// ---------------------------------------------------------------- type

const f = (n) => +n.toFixed(2);

// opentype.js 2.0's toPathData emits NaN for some coordinates; serialise ourselves.
const pathData = (cmds) => cmds.map((c) =>
  c.type === "Z" ? "Z" :
  c.type === "Q" ? `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}` :
  c.type === "C" ? `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}` :
  `${c.type}${f(c.x)} ${f(c.y)}`).join("");

// Lays out `str` glyph by glyph (kerning + tracking in em) and aligns by ink
// bounds, so optical edges line up regardless of sidebearings.
function text(font, str, { x = 0, y = 0, size, tracking = 0, anchor = "start", fill }) {
  const build = (ox) => {
    // Direct cmap lookup: opentype.js chokes on some GSUB lookups, and this
    // is plain ASCII that needs no shaping.
    const glyphs = [...str].map((c) => font.charToGlyph(c));
    const scale = size / font.unitsPerEm;
    const p = new opentype.Path();
    let cx = ox;
    glyphs.forEach((g, i) => {
      // Draw at the origin and translate ourselves: opentype.js emits NaN
      // control points for some TrueType glyphs at fractional offsets.
      for (const c of g.getPath(0, 0, size).commands) {
        const t = { ...c };
        for (const k of ["x", "x1", "x2"]) if (typeof t[k] === "number") t[k] += cx;
        for (const k of ["y", "y1", "y2"]) if (typeof t[k] === "number") t[k] += y;
        p.commands.push(t);
      }
      cx += g.advanceWidth * scale;
      if (i < glyphs.length - 1) cx += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size;
    });
    return p;
  };
  const bb = build(0).getBoundingBox();
  const shift = anchor === "start" ? x - bb.x1 : anchor === "end" ? x - bb.x2 : x - (bb.x1 + bb.x2) / 2;
  const d = pathData(build(shift).commands);
  return {
    svg: `<path d="${d}" fill="${fill}"/>`,
    width: bb.x2 - bb.x1, top: bb.y1, bottom: bb.y2,
    left: bb.x1 + shift, right: bb.x2 + shift,
  };
}

const capHeight = (font, size) => {
  const bb = font.charToGlyph("X").getPath(0, 0, size).getBoundingBox();
  return -bb.y1;
};

// ---------------------------------------------------------------- logos
// Type-only identity: three Ethnocentric lockups, no symbol.

let uid = 0;
const id = (p) => `${p}${++uid}`;

export const logos = {
  full: { str: "XENA STUDIOS", tracking: 0.04, file: "xena-studios" },
  short: { str: "XENA", tracking: 0.06, file: "xena" },
  x: { str: "X", tracking: 0, file: "x" },
};

const CAP = capHeight(display, 100) / 100;

// Draws a logo (a `logos` key, or any { str, tracking }) with its ink top-left
// at (x, y) and the given cap height.
function logo(key, { x = 0, y = 0, cap, fill }) {
  const { str, tracking } = logos[key] ?? key;
  const t = text(display, str, { size: cap / CAP, tracking, fill, x, y: y + cap });
  return { svg: t.svg, width: t.width };
}

// Cap height that fits `key` inside w × h.
const fitCap = (key, w, h) => Math.min(h, (w / logo(key, { cap: 100, fill: "" }).width) * 100);

// Logo centred in a w × h box (optionally filled).
function logoBox(key, { w, h, fill, bg, radius = 0, glow, scaleW = 0.72, scaleH = 0.42 }) {
  const cap = fitCap(key, w * scaleW, h * scaleH);
  const lw = logo(key, { cap, fill: "" }).width, gid = id("glow");
  return svgDoc(f(w), f(h),
    (glow ? `<defs><radialGradient id="${gid}" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${glow}" stop-opacity="0.14"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>` : "") +
    (bg ? `<rect width="${f(w)}" height="${f(h)}" rx="${radius}" fill="${bg}"/>` : "") +
    (glow ? `<rect width="${f(w)}" height="${f(h)}" rx="${radius}" fill="url(#${gid})"/>` : "") +
    logo(key, { x: (w - lw) / 2, y: (h - cap) / 2, cap, fill }).svg);
}

// Transparent export with clear space of half the cap height on every side.
function logoFile(key, fill) {
  const cap = 100, pad = cap / 2, lw = logo(key, { cap, fill }).width;
  return svgDoc(f(lw + pad * 2), cap + pad * 2, logo(key, { x: pad, y: pad, cap, fill }).svg);
}

// The X in Ion Blue on a space tile: GitHub avatar, favicon, app icon.
const avatar = (size = 512, radius = 0) => logoBox("x", { w: size, h: size, fill: C.accent, bg: C.space, glow: C.accent, radius, scaleH: 0.4, scaleW: 0.6 });

// ---------------------------------------------------------------- raptor

// The favicon / app icon: claw R in on-signal Ink on a Signal Red tile, 6/32 corners.
const raptorIcon = (size) => svgDoc(size, size,
  `<rect width="${size}" height="${size}" rx="${f((size * 6) / 32)}" fill="${R["signal-red"]}"/>` +
  `<path d="${clawPath}" transform="translate(${f((size * 1.76) / 32)} ${f((size * 25.6) / 32)}) scale(${f(((size / 32) * 0.028) * 1e5) / 1e5})" fill-rule="evenodd" fill="${R["on-signal"]}"/>`);

// The small mark: claw R alone in Signal Red (logo.tsx's Logo).
const raptorMark = (size) => svgDoc(size, size,
  `<path d="${clawPath}" transform="translate(${f((size * -0.9) / 32)} ${f((size * 28.3) / 32)}) scale(${f(((size / 32) * 0.0335) * 1e5) / 1e5})" fill-rule="evenodd" fill="${R["signal-red"]}"/>`);

// The full logo, raptor beside RAPTOR, at height h with its top-left at (x, y).
const raptorLogo = (x, y, h, word = R.bone) => {
  const s = h / lockup.h;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * 1e4) / 1e4})">` +
    `<path transform="translate(0 -3)" fill-rule="evenodd" fill="${R["signal-red"]}" d="${raptorPath}"/>` +
    `<path transform="translate(${lockup.word.x} ${lockup.word.y}) scale(${lockup.word.scale})" fill="${word}" d="${wordmarkPath}"/></g>`;
};

// ---------------------------------------------------------------- scenery

// The horizon: a huge planet whose Ion Blue limb arcs across the bottom of the frame.
function planetLimb(w, h, { cx = w * 0.62, r = w * 1.1, top = h * 0.74, sky = C.void, body = C.surface, rim = C.accent } = {}) {
  const cy = top + r;
  const g = id("limb"), b = id("glow");
  return `<defs><linearGradient id="${g}" x1="0" y1="${f(top)}" x2="0" y2="${f(top + h * 0.5)}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${body}"/><stop offset="1" stop-color="${sky}"/></linearGradient>` +
    `<filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(h * 0.035)}"/></filter></defs>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${rim}" stroke-width="${f(h * 0.05)}" opacity="0.22" filter="url(#${b})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${g})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${rim}" stroke-width="1.5" opacity="0.7"/>`;
}

// ---------------------------------------------------------------- compositions

const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// Org graphics: XENA STUDIOS and the tagline over the horizon.
function orgCard(w, h, { scale = 1 } = {}) {
  let body = `<rect width="${w}" height="${h}" fill="${C.void}"/>`;
  body += planetLimb(w, h, { cx: w / 2, r: w * 1.3, top: h * 0.78 });
  const cap = 44 * scale, lw = logo("full", { cap, fill: "" }).width, cy = h * 0.42;
  body += logo("full", { x: (w - lw) / 2, y: cy - cap / 2, cap, fill: C.text }).svg;
  body += text(monoLight, ORG_TAGLINE, { size: 22 * scale, tracking: 0.02, fill: C.muted, x: w / 2, y: cy + cap / 2 + 56 * scale, anchor: "middle" }).svg;
  return svgDoc(w, h, body);
}

// Raptor README banner, 1920×600, in Raptor's own colours and type: Ink sky,
// the full logo, a // kicker, and the site's headline in Hanken Grotesk.
function raptorBanner() {
  const W = 1920, H = 600;
  let body = `<rect width="${W}" height="${H}" fill="${R.ink}"/>`;
  body += planetLimb(W, H, { cx: W * 0.7, r: W * 1.25, top: H * 0.8, sky: R.ink, body: R["ink-raised"], rim: R["signal-red"] });
  body += logo("full", { x: 120, y: 98, cap: 14, fill: R.bone }).svg;
  body += text(mono, raptor.kicker, { size: 17, tracking: 0.18, fill: R.ash, x: W - 120, y: 111, anchor: "end" }).svg;
  body += raptorLogo(120, 196, 72);
  const size = 54, y = 384;
  const a = text(hankenBold, raptor.headline[0], { size, tracking: -0.02, fill: R.bone, x: 122, y });
  const space = hankenBold.charToGlyph(" ").advanceWidth * (size / hankenBold.unitsPerEm);
  body += a.svg + text(hankenBold, raptor.headline[1], { size, tracking: -0.02, fill: R["signal-red"], x: a.right + space, y }).svg;
  return svgDoc(W, H, body);
}

// ---------------------------------------------------------------- plugins
// The plugin family (scripts/plugin-brand.mjs): a pixel glyph on a deepslate tile,
// the name with its prefix letter in the accent, and Raptor's banner layout.

const mix = (a, b, t) => "#" + [1, 3, 5].map((i) =>
  Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t)
    .toString(16).padStart(2, "0")).join("").toUpperCase();
const tones = (a) => ({ light: mix(a, "#FFFFFF", 0.38), base: a, dark: mix(a, "#000000", 0.42), floor: mix(a, PC.bg, 0.45) });

// The glyph at (x, y) in px-sized cells, over a hard drop shadow one cell down-right.
function pluginGlyph(p, x, y, px) {
  const cells = glyphCells(p.glyph), t = tones(p.accent);
  let shadow = "", ink = "";
  cells.forEach((row, gy) => row.forEach((c, gx) => {
    if (!c) return;
    if (c !== "floor") shadow += `<rect x="${x + (gx + 1) * px}" y="${y + (gy + 1) * px}" width="${px}" height="${px}"/>`;
    ink += `<rect x="${x + gx * px}" y="${y + gy * px}" width="${px}" height="${px}" fill="${t[c]}"/>`;
  }));
  return `<g shape-rendering="crispEdges"><g fill="#000" opacity="0.35">${shadow}</g>${ink}</g>`;
}

// The icon tile: raised deepslate with a soft accent glow. Whole-pixel cells keep
// small renders crisp; the 16-cell glyph is centred with 3 cells of margin.
function pluginTile(p, x, y, size, radius = 0) {
  const gid = id("pglow"), px = Math.max(1, Math.floor(size / 22)), off = Math.round((size - 16 * px) / 2);
  return `<defs><radialGradient id="${gid}" cx="0.5" cy="0.45" r="0.65"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.16"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${PC.raised}"/>` +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="url(#${gid})"/>` +
    pluginGlyph(p, x + off, y + off, px);
}

// The name, prefix letter in the accent. Laid out as one word so kerning holds.
function pluginName(p, x, y, size, fill = PC.text) {
  const opts = { x, y, size, tracking: -0.02 };
  const word = text(groteskBold, p.prefix + p.name, { ...opts, fill });
  return text(groteskBold, p.prefix, { ...opts, fill: p.accent }).svg +
    text(groteskBold, p.name, { ...opts, x: word.right, anchor: "end", fill }).svg;
}

// The horizon, same geometry as Raptor's, with its rim stepped into pixels.
// `accent` is one colour, or a list that splits the visible rim into equal bands
// left to right (the whole family's card).
function blockHorizon(w, h, accent, s = 1) {
  const cx = w * 0.7, r = w * 1.25, top = h * 0.8, cy = top + r, cell = Math.max(4, Math.round(8 * s));
  const g = id("pbody"), b = id("pglow"), accents = [accent].flat();
  // Where the rim enters the frame: cx minus the chord half-width at the bottom edge.
  const x0 = Math.max(0, cx - Math.sqrt(Math.max(0, r * r - (cy - h) ** 2)));
  const band = (x) => accents[Math.min(accents.length - 1, Math.max(0, Math.floor(((x - x0) / (w - x0)) * accents.length)))];
  let body = "", rim = "";
  for (let x = 0; x < w; x += cell) {
    const yy = cy - Math.sqrt(Math.max(0, r * r - (x + cell / 2 - cx) ** 2)), row = Math.round(yy / 4) * 4;
    if (row >= h) continue;
    body += `<rect x="${x}" y="${row}" width="${cell}" height="${h - row}"/>`;
    rim += `<rect x="${x}" y="${row}" width="${cell}" height="2" fill="${band(x)}"/>`;
  }
  const glow = accents.length === 1 ? accents[0] : `url(#${b}g)`;
  return `<defs><linearGradient id="${g}" x1="0" y1="${f(top)}" x2="0" y2="${f(top + h * 0.5)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${PC.raised}"/><stop offset="1" stop-color="${PC.bg}"/></linearGradient>` +
    (accents.length > 1 ? `<linearGradient id="${b}g" x1="0" y1="0" x2="${w}" y2="0" gradientUnits="userSpaceOnUse">${accents.map((a, i) => `<stop offset="${f(i / (accents.length - 1))}" stop-color="${a}"/>`).join("")}</linearGradient>` : "") +
    `<filter id="${b}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${f(h * 0.035)}"/></filter></defs>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${glow}" stroke-width="${f(h * 0.05)}" opacity="0.22" filter="url(#${b})"/>` +
    `<g shape-rendering="crispEdges"><g fill="url(#${g})">${body}</g><g opacity="0.75">${rim}</g></g>`;
}

// Banner in Raptor's layout: XENA STUDIOS top-left, // kicker top-right, the
// icon + name lockup, and a two-tone headline over the horizon. 1920×600 is the
// Modrinth/README banner; other frames set the type scale `s` and centre it.
function pluginBanner(p, W = 1920, H = 600, s = W / 1920) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${PC.bg}"/>` + blockHorizon(W, H, p.accent, s);
  body += logo("full", { x: m, y: Y(98), cap: 14 * s, fill: PC.text }).svg;
  body += text(mono, p.kicker, { size: 17 * s, tracking: 0.18, fill: PC.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  const ts = Math.round(80 * s);
  body += pluginTile(p, f(m), f(Y(190)), ts, f(16 * s));
  body += pluginName(p, m + ts + 26 * s, Y(251), 76 * s);
  const size = 54 * s, y = Y(384);
  const a = text(groteskBold, p.headline[0], { size, tracking: -0.02, fill: PC.text, x: m, y });
  const space = groteskBold.charToGlyph(" ").advanceWidth * (size / groteskBold.unitsPerEm);
  body += a.svg + text(groteskBold, p.headline[1], { size, tracking: -0.02, fill: p.accent, x: a.right + space, y }).svg;
  return svgDoc(W, H, body);
}

// ---------------------------------------------------------------- neoskript
// NeoSkript keeps its own identity (scripts/neoskript-brand.mjs): Neo Magenta on
// night, the script mark, and Geist. Xena frames it as it frames Raptor.

// The .sk mark, ink-centred on (cx, cy), w wide.
function nsMark(cx, cy, w, fill) {
  const probe = text(geistBold, markText.str, { size: 100, tracking: markText.tracking, fill });
  const size = (w / probe.width) * 100, t = text(geistBold, markText.str, { size, tracking: markText.tracking, fill, x: cx, anchor: "middle", y: 0 });
  return t.svg.replace("<path ", `<path transform="translate(0 ${f(cy - (t.top + t.bottom) / 2)})" `);
}

// The icon: .sk in night on a magenta tile, built like Raptor's: 6/32 corners and
// the letters nearly filling the tile. App icon, Modrinth icon, avatar, favicon;
// and, small, the logo's mark.
const nsTile = (x, y, size, fg = NS.night, bg = NS.magenta) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(size)}" height="${f(size)}" rx="${f((size * 6) / 32)}" fill="${bg}"/>` +
  nsMark(x + size / 2, y + size / 2, size * 0.76, fg);
const nsIcon = (size) => svgDoc(size, size, nsTile(0, 0, size));

// The logo: the icon tile beside the NeoSkript wordmark, the tile 1.5 × the cap height.
function nsLogo(x, y, cap, { word = NS.text, accent = NS.magenta } = {}) {
  const size = cap / (capHeight(geistBold, 100) / 100), h = cap * 1.5;
  const t = text(geistBold, "NeoSkript", { x: x + h + cap * 0.45, y: y + (h + cap) / 2, size, tracking: -0.03, fill: word });
  return { svg: nsTile(x, y, h, NS.night, accent) + t.svg, width: t.right - x, height: h };
}
const nsLogoFile = (opts) => {
  const cap = 100, pad = cap / 2, l = nsLogo(pad, pad, cap, opts);
  return svgDoc(f(l.width + pad * 2), f(l.height + pad * 2), l.svg);
};

// Banner in Raptor's layout, with a code card showing a script that runs unchanged.
function nsBanner(W = 1920, H = 600, s = W / 1920, card = true) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${NS.night}"/>`;
  body += planetLimb(W, H, { cx: W * 0.7, r: W * 1.25, top: H * 0.8, sky: NS.night, body: NS["night-raised"], rim: NS.magenta });
  body += logo("full", { x: m, y: Y(98), cap: 14 * s, fill: NS.text }).svg;
  body += text(mono, neoskript.kicker, { size: 17 * s, tracking: 0.18, fill: NS.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  body += nsLogo(m, Y(190), 46 * s).svg;
  const size = 54 * s, y = Y(384);
  const a = text(geistBold, neoskript.headline[0], { size, tracking: -0.025, fill: NS.text, x: m, y });
  const space = geistBold.charToGlyph(" ").advanceWidth * (size / geistBold.unitsPerEm);
  body += a.svg + text(geistBold, neoskript.headline[1], { size, tracking: -0.025, fill: NS.magenta, x: a.right + space, y }).svg;
  if (card) {
    const cw = 620 * s, cx = W - m - cw, cy = Y(176), ch = 150 * s;
    body += `<rect x="${f(cx)}" y="${f(cy)}" width="${f(cw)}" height="${f(ch)}" rx="${f(16 * s)}" fill="${NS["night-raised"]}" stroke="${NS["night-rule"]}" stroke-width="2"/>`;
    body += text(mono, neoskript.sample.file, { x: cx + 30 * s, y: cy + 36 * s, size: 15 * s, tracking: 0.08, fill: NS.muted }).svg;
    neoskript.sample.lines.forEach((line, i) => {
      let lx = cx + 30 * s;
      const ly = cy + (80 + i * 40) * s, adv = geistMono.charToGlyph(" ").advanceWidth * ((24 * s) / geistMono.unitsPerEm);
      for (const [str, c] of line) {
        if (str.trim()) body += text(geistMono, str.trimStart(), { x: lx + (str.length - str.trimStart().length) * adv, y: ly, size: 24 * s, fill: NS[c] }).svg;
        lx += str.length * adv;
      }
    });
  }
  return svgDoc(W, H, body);
}

// ---------------------------------------------------------------- repo cards
// GitHub social previews (1280×640) and the docs' link preview, in Raptor's
// banner layout so every card in the org reads as one set.

// The studio's own card, in xenastudios.co's look: XENA STUDIOS top-left, a //
// kicker top-right, a JetBrains Mono SemiBold title, a lead, and optionally the
// plugin icons, over the Ion Blue horizon.
function xenaCard({ kicker, title, lead, icons = false }, W = 1280, H = 640) {
  const s = 0.9, dy = (H - 600 * s) / 2, m = 120 * s, Y = (v) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${C.void}"/>`;
  body += planetLimb(W, H, { cx: W * 0.7, r: W * 1.25, top: H * 0.8 });
  body += logo("full", { x: m, y: Y(98), cap: 14 * s, fill: C.text }).svg;
  body += text(mono, kicker, { size: 17 * s, tracking: 0.18, fill: C.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  body += text(monoSemi, title, { size: 104 * s, tracking: -0.03, fill: C.text, x: m, y: Y(292) }).svg;
  body += text(monoLight, lead, { size: 31 * s, tracking: 0, fill: C.muted, x: m, y: Y(372) }).svg;
  if (icons) plugins.forEach((p, i) => { body += pluginTile(p, f(m + i * 80 * s), f(Y(410)), Math.round(64 * s), f(13 * s)); });
  return svgDoc(W, H, body);
}

// The plugin family's card: all three names in a row, a lead, and the stepped
// horizon with its rim split into the three accents.
function pluginsCard(W = 1280, H = 640) {
  const s = 0.9, dy = (H - 600 * s) / 2, m = 120 * s, Y = (v) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${PC.bg}"/>` + blockHorizon(W, H, plugins.map((p) => p.accent), s);
  body += logo("full", { x: m, y: Y(98), cap: 14 * s, fill: PC.text }).svg;
  body += text(mono, "// PLUGINS", { size: 17 * s, tracking: 0.18, fill: PC.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  const ts = Math.round(64 * s), size = 50 * s;
  let x = m;
  for (const p of plugins) {
    body += pluginTile(p, f(x), f(Y(196)), ts, f(13 * s));
    body += pluginName(p, x + ts + 18 * s, Y(196) + ts / 2 + size * 0.36, size);
    const w = text(groteskBold, p.prefix + p.name, { size, tracking: -0.02, fill: "" }).width;
    x += ts + 18 * s + w + 52 * s;
  }
  body += text(groteskBold, "Small, fast plugins for Paper servers.", { size: 48 * s, tracking: -0.02, fill: PC.text, x: m, y: Y(384) }).svg;
  return svgDoc(W, H, body);
}

// The plugin docs' link preview, in the family's look: the three icons, the
// title and a line over the three-accent stepped horizon.
function pluginDocsCard(W = 1200, H = 630) {
  const s = 0.9, dy = (H - 600 * s) / 2, m = 120 * s, Y = (v) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${PC.bg}"/>` + blockHorizon(W, H, plugins.map((p) => p.accent), s);
  body += logo("full", { x: m, y: Y(98), cap: 14 * s, fill: PC.text }).svg;
  body += text(mono, "// PLUGIN DOCS", { size: 17 * s, tracking: 0.18, fill: PC.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  const ts = Math.round(64 * s);
  plugins.forEach((p, i) => { body += pluginTile(p, f(m + i * (ts + 14 * s)), f(Y(176)), ts, f(13 * s)); });
  body += text(groteskBold, "Plugin docs", { size: 96 * s, tracking: -0.03, fill: PC.text, x: m, y: Y(340) }).svg;
  body += text(groteskBold, "Setup, commands and config for xUtilities, zChat and xLimbo.", { size: 30 * s, tracking: -0.01, fill: PC.muted, x: m, y: Y(400) }).svg;
  return svgDoc(W, H, body);
}

const repoCards = {
  brand: { kicker: "// BRAND", title: "Brand", lead: "Logos, colours and graphics for every Xena brand." },
  website: { kicker: "// WEBSITE", title: "xenastudios.co", lead: "The studio's website. Astro, served by Cloudflare." },
  dotgithub: { kicker: "// GITHUB", title: "Xena Studios", lead: ORG_TAGLINE },
};

// ---------------------------------------------------------------- output

const written = [];
function out(rel, svg, pngWidth) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, svg);
  written.push(rel);
  const png = new Resvg(svg, { fitTo: { mode: "width", value: pngWidth }, font: { loadSystemFonts: false } }).render().asPng();
  fs.writeFileSync(file.replace(/\.svg$/, ".png"), png);
}

for (const k of Object.keys(logos)) {
  const name = logos[k].file, w = k === "x" ? 1024 : 2400;
  out(`logo/${name}.svg`, logoFile(k, C.text), w);
  out(`logo/${name}-blue.svg`, logoFile(k, C.accent), w);
  out(`logo/${name}-white.svg`, logoFile(k, "#FFFFFF"), w);
  out(`logo/${name}-black.svg`, logoFile(k, "#0A0B10"), w);
}

out("avatar/avatar.svg", avatar(512), 1024);
out("avatar/favicon.svg", avatar(64, 12), 64);

out("social/x-header.svg", orgCard(1500, 500), 3000);
out("social/discord-banner.svg", orgCard(960, 540, { scale: 0.75 }), 1920);
out("social/og-card.svg", orgCard(1200, 630, { scale: 0.85 }), 2400);

out("raptor/banner.svg", raptorBanner(), 3840);
out("raptor/icon.svg", raptorIcon(512), 1024);
out("raptor/mark.svg", raptorMark(512), 1024);
out("raptor/logo-dark.svg", svgDoc(lockup.w * 4, lockup.h * 4, raptorLogo(0, 0, lockup.h * 4)), 2312);
out("raptor/logo-light.svg", svgDoc(lockup.w * 4, lockup.h * 4, raptorLogo(0, 0, lockup.h * 4, R.graphite).replace(R["signal-red"], R["signal-red-daylight"])), 2312);
// Google Workspace header logo (Admin console → Account → Personalization):
// 320×132 max. Black XENA on transparent: Google frames the logo in white, so a
// dark tile reads as a box with a border. XENA STUDIOS is illegible at the
// ~40px height Gmail draws it. As large as the half-cap clear space allows.
out("workspace/logo.svg", logoBox("short", { w: 320, h: 132, fill: "#0A0B10", scaleW: 0.86, scaleH: 0.5 }), 320);

// The horizon on its own, no type: backgrounds for the website and anything else.
out("scene/horizon.svg", svgDoc(2400, 900, `<rect width="2400" height="900" fill="${C.void}"/>` + planetLimb(2400, 900, { cx: 1200, r: 2400 * 1.3, top: 900 * 0.62 })), 2400);
// Team profile photos (Google account, GitHub, Discord): the person's initial
// in the avatar's style. Square; Google crops to a circle, which the glyph clears.
const people = { zachary: "Z" };
for (const [name, ch] of Object.entries(people))
  out(`people/${name}.svg`, logoBox({ str: ch, tracking: 0 }, { w: 512, h: 512, fill: C.accent, bg: C.space, glow: C.accent, scaleH: 0.4, scaleW: 0.6 }), 1024);

// The plugin family: Modrinth icon (512), README/Modrinth banner (1920×600 @2×)
// and GitHub social preview (1280×640, GitHub's recommended size).
for (const p of plugins) {
  out(`plugins/${p.id}/icon.svg`, svgDoc(512, 512, pluginTile(p, 0, 0, 512)), 512);
  out(`plugins/${p.id}/banner.svg`, pluginBanner(p), 3840);
  // Link cards shrink this to ~500px wide, so the type runs near full width.
  out(`plugins/${p.id}/social.svg`, pluginBanner(p, 1280, 640, 0.9), 1280);
}

// NeoSkript: icon (Modrinth, GitHub, favicon), small mark, dark/light logos,
// README banner (1920×600 @2×) and GitHub social preview (1280×640).
out("neoskript/icon.svg", nsIcon(512), 1024);
out("neoskript/mark.svg", svgDoc(512, 512, nsMark(256, 256, 400, NS.magenta)), 1024);
out("neoskript/logo-dark.svg", nsLogoFile({}), 2400);
out("neoskript/logo-light.svg", nsLogoFile({ word: NS.ink, accent: NS["magenta-daylight"] }), 2400);
out("neoskript/banner.svg", nsBanner(), 3840);
out("neoskript/social.svg", nsBanner(1280, 640, 0.9, false), 1280);

// GitHub social previews (repo Settings → Social preview) and the docs' link preview.
for (const [name, card] of Object.entries(repoCards)) out(`github/${name}.svg`, xenaCard(card), 1280);
out("github/plugins.svg", pluginsCard(), 1280);
out("social/docs-og.svg", pluginDocsCard(), 2400);
// The family's horizon alone, rim in all three accents: the docs' home page.
out("plugins/horizon.svg", svgDoc(2400, 900, `<rect width="2400" height="900" fill="${PC.bg}"/>` + blockHorizon(2400, 900, plugins.map((p) => p.accent), 1.5)), 2400);

// PNG previews of the official files copied from xena-studios/raptor.
for (const f of ["logo-dark", "logo-light", "favicon"]) {
  const svg = hexify(fs.readFileSync(path.join(ROOT, `raptor/official/${f}.svg`), "utf8"));
  fs.writeFileSync(path.join(ROOT, `raptor/official/${f}.png`), new Resvg(svg, { fitTo: { mode: "width", value: f === "favicon" ? 512 : 1156 } }).render().asPng());
}

fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "tokens/colors.json"), JSON.stringify(C, null, 2) + "\n");
fs.writeFileSync(path.join(ROOT, "tokens/colors.css"), `:root {\n${Object.entries(C).map(([k, v]) => `  --xena-${k}: ${v};`).join("\n")}\n}\n`);
fs.writeFileSync(path.join(ROOT, "tokens/raptor.json"), JSON.stringify(Object.fromEntries(Object.entries(raptorColors).map(([k, v]) => [k, { oklch: v.startsWith("oklch") ? v : null, hex: oklchHex(v) }])), null, 2) + "\n");
fs.writeFileSync(path.join(ROOT, "tokens/raptor.css"), `:root {\n${Object.entries(raptorColors).map(([k, v]) => `  --raptor-${k}: ${v}; /* ${oklchHex(v)} */`).join("\n")}\n}\n`);

fs.writeFileSync(path.join(ROOT, "tokens/neoskript.json"), JSON.stringify(NS, null, 2) + "\n");
fs.writeFileSync(path.join(ROOT, "tokens/neoskript.css"), `:root {\n${Object.entries(NS).map(([k, v]) => `  --neoskript-${k}: ${v};`).join("\n")}\n}\n`);
const pluginTokens = { ...PC, ...Object.fromEntries(plugins.map((p) => [p.id, p.accent])) };
fs.writeFileSync(path.join(ROOT, "tokens/plugins.json"), JSON.stringify(pluginTokens, null, 2) + "\n");
fs.writeFileSync(path.join(ROOT, "tokens/plugins.css"), `:root {\n${Object.entries(pluginTokens).map(([k, v]) => `  --plugin-${k}: ${v};`).join("\n")}\n}\n`);

console.log(`wrote ${written.length} svgs (+png)`);
