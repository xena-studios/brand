// The studio's own art: the logos and avatar, the org's social graphics, and the cards
// and README banners for the studio's repos.
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { C, ORG_TAGLINE, logos, type Lockup } from "../xena-brand.ts";
import { family } from "../plugin-brand.ts";
import { fonts } from "../fonts.ts";
import { f, text, capHeight } from "../type.ts";
import { committedLogo, endorsement, type LogoKey } from "../logo.ts";
import type { Out } from "../output.ts";
import { id, svgDoc, planetLimb } from "./common.ts";
import { pluginTile } from "./plugins.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const { ethnocentric: display, mono, monoLight, monoSemi } = fonts;

let cap100: number | undefined;
const CAP = () => (cap100 ??= capHeight(display, 100) / 100);

// Draws a logo (a `logos` key, or any { str, tracking }) with its ink top-left
// at (x, y) and the given cap height. The logos come from their committed outlines
// in logo/ (scripts/logo.ts); only logoFile, which writes those, and the team photos'
// initials set Ethnocentric itself.
export function logo(key: LogoKey | Lockup, { x = 0, y = 0, cap, fill }: { x?: number; y?: number; cap: number; fill: string }) {
  if (typeof key === "string") return committedLogo(key, { x, y, cap, fill });
  return ethnocentric(key, { x, y, cap, fill });
}

function ethnocentric({ str, tracking }: Lockup, { x = 0, y = 0, cap, fill }: { x?: number; y?: number; cap: number; fill: string }) {
  const t = text(display, str, { size: cap / CAP(), tracking, fill, x, y: y + cap });
  return { svg: t.svg, width: t.width };
}

// Cap height that fits `key` inside w × h.
const fitCap = (key: LogoKey | Lockup, w: number, h: number) => Math.min(h, (w / logo(key, { cap: 100, fill: "" }).width) * 100);

// Logo centred in a w × h box (optionally filled).
interface LogoBoxOptions {
  w: number;
  h: number;
  fill: string;
  bg?: string;
  radius?: number;
  glow?: string;
  scaleW?: number;
  scaleH?: number;
}

function logoBox(key: LogoKey | Lockup, { w, h, fill, bg, radius = 0, glow, scaleW = 0.72, scaleH = 0.42 }: LogoBoxOptions) {
  const cap = fitCap(key, w * scaleW, h * scaleH);
  const lw = logo(key, { cap, fill: "" }).width, gid = id("glow");
  return svgDoc(f(w), f(h),
    (glow ? `<defs><radialGradient id="${gid}" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${glow}" stop-opacity="0.14"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>` : "") +
    (bg ? `<rect width="${f(w)}" height="${f(h)}" rx="${radius}" fill="${bg}"/>` : "") +
    (glow ? `<rect width="${f(w)}" height="${f(h)}" rx="${radius}" fill="url(#${gid})"/>` : "") +
    logo(key, { x: (w - lw) / 2, y: (h - cap) / 2, cap, fill }).svg);
}

// Transparent export with clear space of half the cap height on every side.
function logoFile(key: LogoKey, fill: string) {
  const cap = 100, pad = cap / 2, lw = ethnocentric(logos[key], { cap, fill }).width;
  return svgDoc(f(lw + pad * 2), cap + pad * 2, ethnocentric(logos[key], { x: pad, y: pad, cap, fill }).svg);
}

// The X in Ion Blue on a space tile: GitHub avatar, favicon, app icon.
const avatar = (size = 512, radius = 0) => logoBox("x", { w: size, h: size, fill: C.accent, bg: C.space, glow: C.accent, radius, scaleH: 0.4, scaleW: 0.6 });

// Org graphics: XENA STUDIOS and the tagline over the horizon.
function orgCard(w: number, h: number, { scale = 1 } = {}) {
  let body = `<rect width="${w}" height="${h}" fill="${C.void}"/>`;
  body += planetLimb(w, h, { cx: w / 2, r: w * 1.3, top: h * 0.78 });
  const cap = 44 * scale, lw = logo("full", { cap, fill: "" }).width, cy = h * 0.42;
  body += logo("full", { x: (w - lw) / 2, y: cy - cap / 2, cap, fill: C.text }).svg;
  body += text(monoLight, ORG_TAGLINE, { size: 22 * scale, tracking: 0.02, fill: C.muted, x: w / 2, y: cy + cap / 2 + 56 * scale, anchor: "middle" }).svg;
  return svgDoc(w, h, body);
}

// The studio's own card, in xenastudios.co's look: XENA STUDIOS top-left, a //
// kicker top-right, a JetBrains Mono SemiBold title, a lead, and optionally the
// plugin icons, over the Ion Blue horizon.
interface Card { kicker: string; title: string; lead: string; icons?: boolean }

function xenaCard({ kicker, title, lead, icons = false }: Card, W = 1280, H = 640, s = 0.9) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${C.void}"/>`;
  body += planetLimb(W, H, { cx: W * 0.7, r: W * 1.25, top: H * 0.8 });
  body += endorsement(m, Y(98), 14 * s, C.text);
  body += text(mono, kicker, { size: 17 * s, tracking: 0.18, fill: C.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  body += text(monoSemi, title, { size: 104 * s, tracking: -0.03, fill: C.text, x: m, y: Y(292) }).svg;
  body += text(monoLight, lead, { size: 31 * s, tracking: 0, fill: C.muted, x: m, y: Y(372) }).svg;
  if (icons) family.forEach((p, i) => { body += pluginTile(p, f(m + i * 80 * s), f(Y(410)), Math.round(64 * s), f(13 * s)); });
  return svgDoc(W, H, body);
}

const repoCards: Record<string, Card> = {
  brand: { kicker: "// BRAND", title: "Brand", lead: "Logos, colours and graphics for every Xena brand." },
  website: { kicker: "// WEBSITE", title: "xenastudios.co", lead: "The studio's website. Astro, served by Cloudflare." },
  dotgithub: { kicker: "// GITHUB", title: "Xena Studios", lead: ORG_TAGLINE },
  hallow: { kicker: "// HALLOW", title: "Hallow", lead: "A full minigame network on Pumpkin, in Rust." },
  tools: { kicker: "// TOOLS", title: "Xena Tools", lead: "Tools for running a Minecraft server." },
};

/** pnpm build:logos: the logos in every colour, and the team photos' initials. The only files drawn in Ethnocentric. */
export function buildLogos(out: Out) {
  for (const k of Object.keys(logos) as LogoKey[]) {
    const name = logos[k].file, w = k === "x" ? 1024 : 2400;
    out(`logo/${name}.svg`, logoFile(k, C.text), w);
    out(`logo/${name}-blue.svg`, logoFile(k, C.accent), w);
    out(`logo/${name}-white.svg`, logoFile(k, "#FFFFFF"), w);
    out(`logo/${name}-black.svg`, logoFile(k, "#0A0B10"), w);
  }

  // Team profile photos (Google account, GitHub, Discord): the person's initial
  // in the avatar's style. Square; Google crops to a circle, which the glyph clears.
  const people: Record<string, string> = { zachary: "Z" };
  for (const [name, ch] of Object.entries(people))
    out(`people/${name}.svg`, logoBox({ str: ch, tracking: 0 }, { w: 512, h: 512, fill: C.accent, bg: C.space, glow: C.accent, scaleH: 0.4, scaleW: 0.6 }), 1024);
}

/** The avatar, the org's social graphics, the Workspace logo, the bare horizon and the studio's tokens. */
export function buildXena(out: Out) {
  out("avatar/avatar.svg", avatar(512), 1024);
  out("avatar/favicon.svg", avatar(64, 12), 64);
  // The iOS home-screen icon: the avatar at the 180px iOS asks for, square and
  // opaque (iOS rounds the corners itself). PNG only: its SVG is avatar.svg.
  fs.writeFileSync(path.join(ROOT, "avatar/apple-touch-icon.png"), new Resvg(avatar(512), { fitTo: { mode: "width", value: 180 }, font: { loadSystemFonts: false } }).render().asPng());

  out("social/x-header.svg", orgCard(1500, 500), 3000);
  out("social/discord-banner.svg", orgCard(960, 540, { scale: 0.75 }), 1920);
  out("social/og-card.svg", orgCard(1200, 630, { scale: 0.85 }), 2400);

  // Google Workspace header logo (Admin console → Account → Personalization):
  // 320×132 max. Black XENA on transparent: Google frames the logo in white, so a
  // dark tile reads as a box with a border. XENA STUDIOS is illegible at the
  // ~40px height Gmail draws it. As large as the half-cap clear space allows.
  out("workspace/logo.svg", logoBox("short", { w: 320, h: 132, fill: "#0A0B10", scaleW: 0.86, scaleH: 0.5 }), 320);

  // The horizon on its own, no type: backgrounds for the website and anything else.
  out("scene/horizon.svg", svgDoc(2400, 900, `<rect width="2400" height="900" fill="${C.void}"/>` + planetLimb(2400, 900, { cx: 1200, r: 2400 * 1.3, top: 900 * 0.62 })), 2400);

  fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tokens/colors.json"), JSON.stringify(C, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "tokens/colors.css"), `:root {\n${Object.entries(C).map(([k, v]) => `  --xena-${k}: ${v};`).join("\n")}\n}\n`);
}

/** GitHub social previews (repo Settings → Social preview) and README banners for the studio's own repos. */
export function buildRepoCards(out: Out) {
  for (const [name, card] of Object.entries(repoCards)) out(`github/${name}.svg`, xenaCard(card), 1280);
  // README banners in Raptor's and NeoSkript's banner size (1920×600 @2×), so every
  // README in the org opens the same way.
  for (const [name, card] of Object.entries(repoCards)) out(`github/${name}-banner.svg`, xenaCard(card, 1920, 600, 1), 3840);
}
