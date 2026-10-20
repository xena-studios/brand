// Generates every Xena Studios brand asset from code: logos, avatar, social
// graphics and Raptor's README banner. All type is converted to outlines so no
// font file ever ships (Ethnocentric's desktop EULA forbids redistribution).
//
//   npm run build
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";
import { clawPath, raptorPath, wordmarkPath, wordmarkBox } from "./raptor-brand.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const FONT_DIR = path.join(os.homedir(), "Library/Fonts");
const fontFile = (p) => opentype.parse(fs.readFileSync(p).buffer);

const display = fontFile(process.env.ETHNOCENTRIC ?? path.join(ROOT, ".local-fonts/Ethnocentric-Regular.otf"));
const mono = fontFile(process.env.MONO ?? path.join(FONT_DIR, "JetBrainsMono-Regular.ttf"));
const monoLight = fontFile(process.env.MONO_LIGHT ?? path.join(FONT_DIR, "JetBrainsMono-Light.ttf"));

// ---------------------------------------------------------------- tokens

// Ion Blue on deep space.
export const C = {
  void: "#06080D", space: "#0A0E16", surface: "#121824", line: "#222B3B",
  muted: "#8A93A6", text: "#EDF1F7", accent: "#5CB4FF",
};

// Raptor keeps its own identity (red, Archivo wordmark, raptor, claw R);
// Xena provides the horizon and the "XENA STUDIOS" endorsement.
const raptor = {
  red: "#F05653",
  tagline: "Turn any Linux box into a reliable game server host.",
  kind: "GAME SERVER PANEL",
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

// Draws a logo with its ink top-left at (x, y) and the given cap height.
function logo(key, { x = 0, y = 0, cap, fill }) {
  const t = text(display, logos[key].str, { size: cap / CAP, tracking: logos[key].tracking, fill, x, y: y + cap });
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

// Claw R on a red tile, as Raptor's favicon draws it.
const clawTile = (x, y, size, r = size * 0.22) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(size)}" height="${f(size)}" rx="${f(r)}" fill="${raptor.red}"/>` +
  `<path d="${clawPath}" transform="translate(${f(x + size * 0.055)} ${f(y + size * 0.8)}) scale(${f((size / 32) * 0.028 * 1e4) / 1e4})" fill-rule="evenodd" fill="#FFFFFF"/>`;

// "RAPTOR" wordmark with its ink cap height = `cap`, left edge at x, baseline y.
const raptorWordmark = (x, y, cap, fill) => {
  const s = cap / 687.4;
  return { svg: `<path d="${wordmarkPath}" transform="translate(${f(x - wordmarkBox.x * s)} ${f(y)}) scale(${f(s * 1e5) / 1e5})" fill="${fill}"/>`, width: wordmarkBox.w * s };
};

const raptorRun = (x, y, h, fill) => {
  const s = h / 46;
  return `<path d="${raptorPath}" transform="translate(${f(x)} ${f(y - 3 * s)}) scale(${f(s * 1e4) / 1e4})" fill-rule="evenodd" fill="${fill}"/>`;
};

// ---------------------------------------------------------------- scenery

// The horizon: a huge planet whose Ion Blue limb arcs across the bottom of the frame.
function planetLimb(w, h, { cx = w * 0.62, r = w * 1.1, top = h * 0.74 } = {}) {
  const cy = top + r;
  const g = id("limb"), b = id("glow");
  return `<defs><linearGradient id="${g}" x1="0" y1="${f(top)}" x2="0" y2="${f(top + h * 0.5)}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${C.surface}"/><stop offset="1" stop-color="${C.void}"/></linearGradient>` +
    `<filter id="${b}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(h * 0.035)}"/></filter></defs>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${C.accent}" stroke-width="${f(h * 0.05)}" opacity="0.22" filter="url(#${b})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${g})"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${C.accent}" stroke-width="1.5" opacity="0.7"/>`;
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

// Raptor README banner, 1920×600: the raptor always sits beside the name.
function raptorBanner() {
  const W = 1920, H = 600;
  let body = `<rect width="${W}" height="${H}" fill="${C.void}"/>`;
  body += planetLimb(W, H, { cx: W * 0.7, r: W * 1.25, top: H * 0.8 });
  body += logo("full", { x: 120, y: 98, cap: 14, fill: C.text }).svg;
  body += text(mono, raptor.kind, { size: 17, tracking: 0.3, fill: C.muted, x: W - 120, y: 111, anchor: "end" }).svg;
  const cap = 74, base = 300, runH = 100, runW = runH * (96 / 46), wx = 120 + runW + 40;
  body += raptorRun(120, base - cap / 2 - runH / 2, runH, raptor.red);
  body += raptorWordmark(wx, base, cap, C.text).svg;
  body += text(monoLight, raptor.tagline, { size: 30, tracking: 0.02, fill: C.muted, x: wx + 2, y: base + 62 }).svg;
  return svgDoc(W, H, body);
}

// Raptor link preview, 1200×630.
function raptorCard() {
  const w = 1200, h = 630, runH = 64, cap = 58, runW = runH * (96 / 46);
  let body = `<rect width="${w}" height="${h}" fill="${C.void}"/>`;
  body += planetLimb(w, h, { cx: w / 2, r: w * 1.3, top: h * 0.8 });
  const total = runW + 28 + raptorWordmark(0, 0, cap, "").width, x0 = (w - total) / 2, cy = h * 0.4;
  body += raptorRun(x0, cy - runH / 2, runH, raptor.red);
  body += raptorWordmark(x0 + runW + 28, cy + cap / 2, cap, C.text).svg;
  body += text(monoLight, raptor.tagline, { size: 24, tracking: 0.02, fill: C.muted, x: w / 2, y: cy + 90, anchor: "middle" }).svg;
  const lw = logo("full", { cap: 11, fill: "" }).width;
  body += logo("full", { x: (w - lw) / 2, y: h - 72, cap: 11, fill: C.muted }).svg;
  return svgDoc(w, h, body);
}

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
out("raptor/og-card.svg", raptorCard(), 2400);
out("raptor/icon.svg", svgDoc(512, 512, clawTile(0, 0, 512, 112)), 1024);

fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "tokens/colors.json"), JSON.stringify(C, null, 2) + "\n");
fs.writeFileSync(path.join(ROOT, "tokens/colors.css"), `:root {\n${Object.entries(C).map(([k, v]) => `  --xena-${k}: ${v};`).join("\n")}\n}\n`);

console.log(`wrote ${written.length} svgs (+png)`);
