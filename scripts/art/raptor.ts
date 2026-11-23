// Raptor keeps its own identity (docs/DESIGN.md in xena-studios/raptor): Signal Red on
// warm Ink, the raptor + RAPTOR lockup, and the claw R. Xena frames it with the XENA
// STUDIOS endorsement and the // kicker.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { clawPath, raptorPath, wordmarkPath, raptorColors, lockup } from "../raptor-brand.ts";
import { fonts } from "../fonts.ts";
import { f, text } from "../type.ts";
import { endorsement } from "../logo.ts";
import type { Out } from "../output.ts";
import { svgDoc, planetLimb, oklchHex, hexify } from "./common.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const { mono, hankenBold } = fonts;

const R = Object.fromEntries(Object.entries(raptorColors).map(([k, v]) => [k, oklchHex(v)]));
const raptor = {
  kicker: "// GAME SERVER PANEL",
  headline: ["Your machine. ", "Every game."],
};

// The favicon / app icon: claw R in on-signal Ink on a Signal Red tile, 6/32 corners.
const raptorIcon = (size: number) => svgDoc(size, size,
  `<rect width="${size}" height="${size}" rx="${f((size * 6) / 32)}" fill="${R["signal-red"]}"/>` +
  `<path d="${clawPath}" transform="translate(${f((size * 1.76) / 32)} ${f((size * 25.6) / 32)}) scale(${f(((size / 32) * 0.028) * 1e5) / 1e5})" fill-rule="evenodd" fill="${R["on-signal"]}"/>`);

// The small mark: claw R alone in Signal Red (logo.tsx's Logo).
const raptorMark = (size: number) => svgDoc(size, size,
  `<path d="${clawPath}" transform="translate(${f((size * -0.9) / 32)} ${f((size * 28.3) / 32)}) scale(${f(((size / 32) * 0.0335) * 1e5) / 1e5})" fill-rule="evenodd" fill="${R["signal-red"]}"/>`);

// The full logo, raptor beside RAPTOR, at height h with its top-left at (x, y).
const raptorLogo = (x: number, y: number, h: number, word = R.bone) => {
  const s = h / lockup.h;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * 1e4) / 1e4})">` +
    `<path transform="translate(0 -3)" fill-rule="evenodd" fill="${R["signal-red"]}" d="${raptorPath}"/>` +
    `<path transform="translate(${lockup.word.x} ${lockup.word.y}) scale(${lockup.word.scale})" fill="${word}" d="${wordmarkPath}"/></g>`;
};

// Raptor README banner, 1920×600, in Raptor's own colours and type: Ink sky,
// the full logo, a // kicker, and the site's headline in Hanken Grotesk.
function raptorBanner() {
  const W = 1920, H = 600;
  let body = `<rect width="${W}" height="${H}" fill="${R.ink}"/>`;
  body += planetLimb(W, H, { cx: W * 0.7, r: W * 1.25, top: H * 0.8, sky: R.ink, body: R["ink-raised"], rim: R["signal-red"] });
  body += endorsement(120, 98, 14, R.bone);
  body += text(mono, raptor.kicker, { size: 17, tracking: 0.18, fill: R.ash, x: W - 120, y: 111, anchor: "end" }).svg;
  body += raptorLogo(120, 196, 72);
  const size = 54, y = 384;
  const a = text(hankenBold, raptor.headline[0], { size, tracking: -0.02, fill: R.bone, x: 122, y });
  const space = hankenBold.charToGlyph(" ").advanceWidth * (size / hankenBold.unitsPerEm);
  body += a.svg + text(hankenBold, raptor.headline[1], { size, tracking: -0.02, fill: R["signal-red"], x: a.right + space, y }).svg;
  return svgDoc(W, H, body);
}

/** Raptor's banner, icon, mark and logos, PNGs of its official files, and its tokens. */
export function buildRaptor(out: Out) {
  out("raptor/banner.svg", raptorBanner(), 3840);
  out("raptor/icon.svg", raptorIcon(512), 1024);
  out("raptor/mark.svg", raptorMark(512), 1024);
  out("raptor/logo-dark.svg", svgDoc(lockup.w * 4, lockup.h * 4, raptorLogo(0, 0, lockup.h * 4)), 2312);
  out("raptor/logo-light.svg", svgDoc(lockup.w * 4, lockup.h * 4, raptorLogo(0, 0, lockup.h * 4, R.graphite).replace(R["signal-red"], R["signal-red-daylight"])), 2312);

  // PNG previews of the official files copied from xena-studios/raptor.
  for (const f of ["logo-dark", "logo-light", "favicon"]) {
    const svg = hexify(fs.readFileSync(path.join(ROOT, `raptor/official/${f}.svg`), "utf8"));
    fs.writeFileSync(path.join(ROOT, `raptor/official/${f}.png`), new Resvg(svg, { fitTo: { mode: "width", value: f === "favicon" ? 512 : 1156 }, font: { loadSystemFonts: false } }).render().asPng());
  }

  fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tokens/raptor.json"), JSON.stringify(Object.fromEntries(Object.entries(raptorColors).map(([k, v]) => [k, { oklch: v.startsWith("oklch") ? v : null, hex: oklchHex(v) }])), null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "tokens/raptor.css"), `:root {\n${Object.entries(raptorColors).map(([k, v]) => `  --raptor-${k}: ${v}; /* ${oklchHex(v)} */`).join("\n")}\n}\n`);
}
