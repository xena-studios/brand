// NeoSkript keeps its own identity (scripts/neoskript-brand.ts): Neo Magenta on night,
// the script mark, and Geist. Xena frames it as it frames Raptor.
import fs from "node:fs";
import path from "node:path";
import { neoskriptColors as NS, neoskript, markText } from "../neoskript-brand.ts";
import { fonts } from "../fonts.ts";
import { f, text, capHeight } from "../type.ts";
import { endorsement } from "../logo.ts";
import type { Out } from "../output.ts";
import { svgDoc, planetLimb } from "./common.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const { mono, geistBold, geistMono } = fonts;

// The .sk mark, ink-centred on (cx, cy), w wide.
function nsMark(cx: number, cy: number, w: number, fill: string) {
  const probe = text(geistBold, markText.str, { size: 100, tracking: markText.tracking, fill });
  const size = (w / probe.width) * 100, t = text(geistBold, markText.str, { size, tracking: markText.tracking, fill, x: cx, anchor: "middle", y: 0 });
  return t.svg.replace("<path ", `<path transform="translate(0 ${f(cy - (t.top + t.bottom) / 2)})" `);
}

// The icon: .sk in night on a magenta tile, built like Raptor's: 6/32 corners and
// the letters nearly filling the tile. App icon, Modrinth icon, avatar, favicon;
// and, small, the logo's mark.
const nsTile = (x: number, y: number, size: number, fg = NS.night, bg = NS.magenta) =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(size)}" height="${f(size)}" rx="${f((size * 6) / 32)}" fill="${bg}"/>` +
  nsMark(x + size / 2, y + size / 2, size * 0.76, fg);
const nsIcon = (size: number) => svgDoc(size, size, nsTile(0, 0, size));

// The logo: the icon tile beside the NeoSkript wordmark, the tile 1.5 × the cap height.
interface NsLogoOptions { word?: string; accent?: string }

function nsLogo(x: number, y: number, cap: number, { word = NS.text, accent = NS.magenta }: NsLogoOptions = {}) {
  const size = cap / (capHeight(geistBold, 100) / 100), h = cap * 1.5;
  const t = text(geistBold, "NeoSkript", { x: x + h + cap * 0.45, y: y + (h + cap) / 2, size, tracking: -0.03, fill: word });
  return { svg: nsTile(x, y, h, NS.night, accent) + t.svg, width: t.right - x, height: h };
}
const nsLogoFile = (opts: NsLogoOptions) => {
  const cap = 100, pad = cap / 2, l = nsLogo(pad, pad, cap, opts);
  return svgDoc(f(l.width + pad * 2), f(l.height + pad * 2), l.svg);
};

// Banner in Raptor's layout, with a code card showing a script that runs unchanged.
function nsBanner(W = 1920, H = 600, s = W / 1920, card = true) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${NS.night}"/>`;
  body += planetLimb(W, H, { cx: W * 0.7, r: W * 1.25, top: H * 0.8, sky: NS.night, body: NS["night-raised"], rim: NS.magenta });
  body += endorsement(m, Y(98), 14 * s, NS.text);
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

/** NeoSkript's icon, favicon, mark, logos, README banner and social preview, and its tokens. */
export function buildNeoskript(out: Out) {
  // Icon (Modrinth, GitHub), favicon, small mark, dark/light logos, README banner
  // (1920×600 @2×) and GitHub social preview (1280×640).
  out("neoskript/icon.svg", nsIcon(512), 1024);
  out("neoskript/favicon.svg", nsIcon(64), 64);
  out("neoskript/mark.svg", svgDoc(512, 512, nsMark(256, 256, 400, NS.magenta)), 1024);
  out("neoskript/logo-dark.svg", nsLogoFile({}), 2400);
  out("neoskript/logo-light.svg", nsLogoFile({ word: NS.ink, accent: NS["magenta-daylight"] }), 2400);
  out("neoskript/banner.svg", nsBanner(), 3840);
  out("neoskript/social.svg", nsBanner(1280, 640, 0.9, false), 1280);

  fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tokens/neoskript.json"), JSON.stringify(NS, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "tokens/neoskript.css"), `:root {\n${Object.entries(NS).map(([k, v]) => `  --neoskript-${k}: ${v};`).join("\n")}\n}\n`);
}
