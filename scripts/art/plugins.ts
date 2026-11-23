// The plugin family (scripts/plugin-brand.ts): a pixel glyph on a deepslate tile, the
// name with its prefix letter in the accent, and Raptor's banner layout, over the
// horizon with its rim stepped into pixels.
import fs from "node:fs";
import path from "node:path";
import { pluginColors as PC, plugins, family, glyphCells, type Plugin } from "../plugin-brand.ts";
import { writeCatalog } from "../catalog.ts";
import { mix } from "../color.ts";
import { fonts } from "../fonts.ts";
import { f, text } from "../type.ts";
import { endorsement } from "../logo.ts";
import type { Out } from "../output.ts";
import { id, svgDoc } from "./common.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const { mono, groteskBold } = fonts;

// The plugin family (scripts/plugin-brand.ts): a pixel glyph on a deepslate tile,
// the name with its prefix letter in the accent, and Raptor's banner layout.

const tones = (a: string) => ({ light: mix(a, "#FFFFFF", 0.38), base: a, dark: mix(a, "#000000", 0.42), floor: mix(a, PC.bg, 0.45) });

// The glyph at (x, y) in px-sized cells, over a hard drop shadow one cell down-right.
function pluginGlyph(p: Plugin, x: number, y: number, px: number) {
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
export function pluginTile(p: Plugin, x: number, y: number, size: number, radius = 0) {
  const gid = id("pglow"), px = Math.max(1, Math.floor(size / 22)), off = Math.round((size - 16 * px) / 2);
  return `<defs><radialGradient id="${gid}" cx="0.5" cy="0.45" r="0.65"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.16"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${PC.raised}"/>` +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="url(#${gid})"/>` +
    pluginGlyph(p, x + off, y + off, px);
}

// The name, prefix letter in the accent. Laid out as one word so kerning holds.
function pluginName(p: Plugin, x: number, y: number, size: number, fill = PC.text) {
  const opts = { x, y, size, tracking: -0.02 };
  const word = text(groteskBold, p.prefix + p.name, { ...opts, fill });
  return text(groteskBold, p.prefix, { ...opts, fill: p.accent }).svg +
    text(groteskBold, p.name, { ...opts, x: word.right, anchor: "end", fill }).svg;
}

// The horizon, same geometry as Raptor's, with its rim stepped into pixels.
// `accent` is one colour, or a list that splits the visible rim into equal bands
// left to right (the whole family's card).
function blockHorizon(w: number, h: number, accent: string | string[], s = 1) {
  const cx = w * 0.7, r = w * 1.25, top = h * 0.8, cy = top + r, cell = Math.max(4, Math.round(8 * s));
  const g = id("pbody"), b = id("pglow"), accents = [accent].flat();
  // Where the rim enters the frame: cx minus the chord half-width at the bottom edge.
  const x0 = Math.max(0, cx - Math.sqrt(Math.max(0, r * r - (cy - h) ** 2)));
  const band = (x: number) => accents[Math.min(accents.length - 1, Math.max(0, Math.floor(((x - x0) / (w - x0)) * accents.length)))];
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
function pluginBanner(p: Plugin, W = 1920, H = 600, s = W / 1920) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${PC.bg}"/>` + blockHorizon(W, H, p.accent, s);
  body += endorsement(m, Y(98), 14 * s, PC.text);
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

// The plugin family's card: all three names in a row, a lead, and the stepped
// horizon with its rim split into the three accents.
function pluginsCard(W = 1280, H = 640, s = 0.9) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${PC.bg}"/>` + blockHorizon(W, H, family.map((p) => p.accent), s);
  body += endorsement(m, Y(98), 14 * s, PC.text);
  body += text(mono, "// PLUGINS", { size: 17 * s, tracking: 0.18, fill: PC.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  // The row is drawn at full size, then shrunk to fit between the margins as the family grows.
  const width = (k: number) => family.reduce((sum, p, i) => sum + Math.round(64 * s * k) + 18 * s * k
    + text(groteskBold, p.prefix + p.name, { size: 50 * s * k, tracking: -0.02, fill: "" }).width + (i < family.length - 1 ? 52 * s * k : 0), 0);
  const k = Math.min(1, (W - 2 * m) / width(1));
  const ts = Math.round(64 * s * k), size = 50 * s * k, rowY = Y(196) + (64 * s - ts) / 2;
  let x = m;
  for (const p of family) {
    body += pluginTile(p, f(x), f(rowY), ts, f(13 * s * k));
    body += pluginName(p, x + ts + 18 * s * k, rowY + ts / 2 + size * 0.36, size);
    const w = text(groteskBold, p.prefix + p.name, { size, tracking: -0.02, fill: "" }).width;
    x += ts + 18 * s * k + w + 52 * s * k;
  }
  body += text(groteskBold, "Small, fast plugins for Paper servers.", { size: 48 * s, tracking: -0.02, fill: PC.text, x: m, y: Y(384) }).svg;
  return svgDoc(W, H, body);
}

// "a, b and c".
const names = (list: string[]) => list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`;

// The plugin docs' link preview, in the family's look: the three icons, the
// title and a line over the three-accent stepped horizon.
function pluginDocsCard(W = 1200, H = 630, s = 0.9) {
  const dy = (H - 600 * s) / 2, m = 120 * s, Y = (v: number) => dy + v * s;
  let body = `<rect width="${W}" height="${H}" fill="${PC.bg}"/>` + blockHorizon(W, H, family.map((p) => p.accent), s);
  body += endorsement(m, Y(98), 14 * s, PC.text);
  body += text(mono, "// PLUGIN DOCS", { size: 17 * s, tracking: 0.18, fill: PC.muted, x: W - m, y: Y(111), anchor: "end" }).svg;
  const ts = Math.round(64 * s);
  family.forEach((p, i) => { body += pluginTile(p, f(m + i * (ts + 14 * s)), f(Y(176)), ts, f(13 * s)); });
  body += text(groteskBold, "Plugin docs", { size: 96 * s, tracking: -0.03, fill: PC.text, x: m, y: Y(340) }).svg;
  // Every plugin by name while the line fits between the margins, then the family as a whole.
  const line = { size: 30 * s, tracking: -0.01, fill: PC.muted, x: m, y: Y(400) };
  const listed = `Setup, commands and config for ${names(family.map((p) => p.prefix + p.name))}.`;
  const fits = text(groteskBold, listed, line).width <= W - 2 * m;
  body += text(groteskBold, fits ? listed : "Setup, commands and config for every Xena Studios plugin.", line).svg;
  return svgDoc(W, H, body);
}

/** Each plugin's icon, banner and social preview, the family's cards and horizon, its tokens and the catalog. */
export function buildPlugins(out: Out) {
  // Modrinth icon (512), README/Modrinth banner (1920×600 @2×) and GitHub social
  // preview (1280×640, GitHub's recommended size).
  for (const p of plugins) {
    out(`plugins/${p.id}/icon.svg`, svgDoc(512, 512, pluginTile(p, 0, 0, 512)), 512);
    out(`plugins/${p.id}/banner.svg`, pluginBanner(p), 3840);
    // Link cards shrink this to ~500px wide, so the type runs near full width.
    out(`plugins/${p.id}/social.svg`, pluginBanner(p, 1280, 640, 0.9), 1280);
  }

  out("github/plugins.svg", pluginsCard(), 1280);
  out("social/docs-og.svg", pluginDocsCard(), 2400);
  // The family's horizon alone, rim in all three accents: the docs' home page.
  out("plugins/horizon.svg", svgDoc(2400, 900, `<rect width="2400" height="900" fill="${PC.bg}"/>` + blockHorizon(2400, 900, family.map((p) => p.accent), 1.5)), 2400);
  out("github/plugins-banner.svg", pluginsCard(1920, 600, 1), 3840);
  out("github/plugin-docs-banner.svg", pluginDocsCard(1920, 600, 1), 3840);

  const pluginTokens = { ...PC, ...Object.fromEntries(plugins.map((p) => [p.id, p.accent])) };
  fs.mkdirSync(path.join(ROOT, "tokens"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tokens/plugins.json"), JSON.stringify(pluginTokens, null, 2) + "\n");
  fs.writeFileSync(path.join(ROOT, "tokens/plugins.css"), `:root {\n${Object.entries(pluginTokens).map(([k, v]) => `  --plugin-${k}: ${v};`).join("\n")}\n}\n`);
  writeCatalog();
}
