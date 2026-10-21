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
import { clawPath, raptorPath, wordmarkPath, raptorColors, lockup } from "./raptor-brand.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const FONT_DIR = path.join(os.homedir(), "Library/Fonts");
const fontFile = (p) => opentype.parse(fs.readFileSync(p).buffer);

const display = fontFile(process.env.ETHNOCENTRIC ?? path.join(ROOT, ".local-fonts/Ethnocentric-Regular.otf"));
const mono = fontFile(process.env.MONO ?? path.join(FONT_DIR, "JetBrainsMono-Regular.ttf"));
const monoLight = fontFile(process.env.MONO_LIGHT ?? path.join(FONT_DIR, "JetBrainsMono-Light.ttf"));
// Raptor's sans (OFL), static 700 instance from Google Fonts.
const hankenBold = fontFile(process.env.HANKEN_BOLD ?? path.join(ROOT, ".local-fonts/HankenGrotesk-700.ttf"));

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
  headline: ["Your own game servers, ", "on your own machine."],
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
// 320×132 max. XENA on a space tile so it reads on light and dark themes
// alike; XENA STUDIOS is illegible at the ~40px height Gmail draws it.
out("workspace/logo.svg", logoBox("short", { w: 320, h: 132, fill: C.text, bg: C.space, radius: 16, scaleW: 0.78, scaleH: 0.42 }), 320);

// The horizon on its own, no type: backgrounds for the website and anything else.
out("scene/horizon.svg", svgDoc(2400, 900, `<rect width="2400" height="900" fill="${C.void}"/>` + planetLimb(2400, 900, { cx: 1200, r: 2400 * 1.3, top: 900 * 0.62 })), 2400);
// Team profile photos (Google account, GitHub, Discord): the person's initial
// in the avatar's style. Square; Google crops to a circle, which the glyph clears.
const people = { zachary: "Z" };
for (const [name, ch] of Object.entries(people))
  out(`people/${name}.svg`, logoBox({ str: ch, tracking: 0 }, { w: 512, h: 512, fill: C.accent, bg: C.space, glow: C.accent, scaleH: 0.4, scaleW: 0.6 }), 1024);

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

console.log(`wrote ${written.length} svgs (+png)`);
