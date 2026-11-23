// MostWanted keeps its own identity (scripts/mostwanted-brand.ts): Desert Orange on dusk,
// the pixel MOSTWANTED wordmark and MW monogram, Lilita One, and the pixel desert at
// sunset, which is its horizon. Xena frames it with the XENA STUDIOS endorsement and the
// // kicker, as it frames Raptor and NeoSkript.
import fs from "node:fs";
import path from "node:path";
import { mostwantedColors as MW, mostwanted, type Art } from "../mostwanted-brand.ts";
import { fonts } from "../fonts.ts";
import { f, text } from "../type.ts";
import { endorsement } from "../logo.ts";
import type { Out } from "../output.ts";
import { id, svgDoc } from "./common.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const { mono, lilita } = fonts;

// Official artwork as an embedded image, w wide, top-left at (x, y).
function mwArt(art: Art, x: number, y: number, w: number) {
  const h = (w * art.h) / art.w;
  const data = fs.readFileSync(path.join(ROOT, art.file)).toString("base64");
  return { svg: `<image x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" href="data:image/png;base64,${data}"/>`, h };
}

// The icon: the MW monogram on a raised dusk tile with a soft orange glow, 6/32
// corners. Server icon, Discord, socials, favicon.
function mwIcon(size: number, radius = (size * 6) / 32) {
  const gid = id("mwglow"), w = size * 0.8, art = mwArt(mostwanted.monogram, 0, 0, w);
  return svgDoc(size, size,
    `<defs><radialGradient id="${gid}" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${MW.orange}" stop-opacity="0.22"/><stop offset="1" stop-color="${MW.orange}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${size}" height="${size}" rx="${f(radius)}" fill="${MW["dusk-raised"]}"/>` +
    `<rect width="${size}" height="${size}" rx="${f(radius)}" fill="url(#${gid})"/>` +
    mwArt(mostwanted.monogram, (size - w) / 2, (size - art.h) / 2, w).svg);
}

// MostWanted's horizon: the pixel desert at sunset, scaled to cover W × H,
// blurred, and darkened toward the edges so type on it stays readable.
function mwDesert(W: number, H: number, s: number) {
  const d = mostwanted.desert, scale = Math.max(W / d.w, H / d.h), w = d.w * scale, h = d.h * scale;
  const blur = id("mwblur"), shade = id("mwshade"), data = fs.readFileSync(path.join(ROOT, d.file)).toString("base64");
  return `<defs><filter id="${blur}" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="${f((7 * W) / 1280)}" edgeMode="duplicate"/></filter>` +
    `<radialGradient id="${shade}" cx="0.5" cy="0.45" r="0.75"><stop offset="0.35" stop-color="${MW.dusk}" stop-opacity="0.1"/><stop offset="1" stop-color="${MW.dusk}" stop-opacity="0.72"/></radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="${MW.dusk}"/>` +
    `<image x="${f((W - w) / 2)}" y="${f((H - h) / 2)}" width="${f(w)}" height="${f(h)}" preserveAspectRatio="none" filter="url(#${blur})" href="data:image/png;base64,${data}"/>` +
    `<rect width="${W}" height="${H}" fill="url(#${shade})"/>`;
}

// Banner: XENA STUDIOS top-left and the // kicker top-right as on every Xena
// banner, then MostWanted's own key art: the wordmark centred on the blurred
// desert, with the tagline under it in Lilita One.
function mwBanner(W = 1920, H = 600, s = W / 1920) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
  let body = mwDesert(W, H, s);
  body += endorsement(m, Y(98), 14 * s, MW.text);
  body += text(mono, mostwanted.kicker, { size: 17 * s, tracking: 0.18, fill: MW.text, x: W - m, y: Y(111), anchor: "end" }).svg;
  const ww = 1100 * s;
  body += mwArt(mostwanted.wordmark, (W - ww) / 2, Y(232), ww).svg;
  // A soft dusk shadow keeps the tagline readable over the bright sand.
  const shadow = id("mwshadow");
  body += `<defs><filter id="${shadow}" x="-10%" y="-50%" width="120%" height="200%"><feDropShadow dx="0" dy="${f(3 * s)}" stdDeviation="${f(6 * s)}" flood-color="${MW.dusk}" flood-opacity="0.75"/></filter></defs>`;
  body += `<g filter="url(#${shadow})">` + text(lilita, mostwanted.tagline, { size: 44 * s, tracking: 0.01, fill: MW.text, x: W / 2, y: Y(460), anchor: "middle" }).svg + "</g>";
  return svgDoc(W, H, body);
}

/** MostWanted's icon, favicon, README banner and social preview, and its tokens. The wordmark, monogram and key art are the official files in mostwanted/official/. */
export function buildMostwanted(out: Out) {
  out("mostwanted/icon.svg", mwIcon(512), 1024);
  out("mostwanted/favicon.svg", mwIcon(64, 12), 64);
  out("mostwanted/banner.svg", mwBanner(), 3840);
  out("mostwanted/social.svg", mwBanner(1280, 640, 0.9), 1280);

  fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tokens/mostwanted.json"), JSON.stringify(MW, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "tokens/mostwanted.css"), `:root {\n${Object.entries(MW).map(([k, v]) => `  --mostwanted-${k}: ${v};`).join("\n")}\n}\n`);
}
