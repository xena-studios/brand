// Airfields' pixel scene: the island route floating in a winter night sky. The
// counterpart of MostWanted's pixel desert (mostwanted/official/desert.png), and
// like it, pixel art: drawn pixel by pixel on a 320×180 canvas, then scaled up
// with nearest neighbour, so every art pixel stays a crisp square.
//
// The route, from the hub out: the hub (cabin, lanterns, smoke), coal, iron, the
// KOTH island with its tower beside iron, gold (its mine glowing), diamond and
// netherite, farther and higher. Farther islands are smaller, bluer and flatter.
// The sky above the middle stays calm: that's where the wordmark goes.
//
// Writes, for each theme that has a scene (winter):
//   airfields/themes/<id>/scene-320x180.png   the art at 1×, for pixelated CSS scaling
//   airfields/themes/<id>/scene.png           1280×720 (4×)
//   airfields/themes/<id>/scene-1920x1080.png 1920×1080 (6×), the website hero
//   airfields/themes/<id>/banner-scene.png    3840×1200 (12×), a wide crop
//   airfields/themes/<id>/key-art.png         1920×1080, the wordmark over the blurred scene
//
// No image libraries: the PNGs are encoded here (node:zlib), and resvg only draws
// the wordmark over the key art. Every random choice is seeded, so a rebuild
// writes the same bytes.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { Resvg } from "@resvg/resvg-js";

export const SCENE_W = 320;
export const SCENE_H = 180;
/** The wide band the banners use: through the islands' tops, under the aurora. */
export const BANNER_CROP = { x: 0, y: 52, w: 320, h: 100 };
const W = SCENE_W, H = SCENE_H;

// ---------------------------------------------------------------- colour

type RGB = [number, number, number];
const hex = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ramp = (...cs: string[]) => cs.map(hex);
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

// The palette. Cool, moonlit versions of each material; gold is the only warm light.
const P = {
  // Night sky, zenith to horizon: navy into indigo, a touch of violet low down.
  sky: ramp("#04071a", "#060b22", "#09102d", "#0c1538", "#101b45", "#142151", "#1a275d", "#202d68", "#273372", "#2f397b", "#373e83", "#41448a"),
  moon: ramp("#fff8dc", "#ffefb4", "#efd98e", "#c9b27a"),
  moonGlow: hex("#b9c2ff"),
  star: ramp("#5c6aa8", "#9eabe0", "#dfe6ff", "#ffffff"),
  auroraLow: hex("#3cf2c6"),
  auroraMid: hex("#46c9e6"),
  auroraHigh: hex("#9a7bff"),
  auroraCore: hex("#b8ffe9"),
  // Rock, outline to highlight: blue-grey stone in moonlight.
  stone: ramp("#080b22", "#151b42", "#212b5a", "#313f74", "#465a92", "#6880b8"),
  dirt: ramp("#1d1324", "#2e1f33", "#433045", "#5a4158"),
  snow: ramp("#5f7fb8", "#9cc2e9", "#d5e7fa", "#f4f9ff", "#ffffff"),
  pine: ramp("#08171f", "#0e2630", "#16383f", "#22504f", "#2f6a5f"),
  wood: ramp("#1c1014", "#2f1c1f", "#4a2c27", "#6a4232"),
  gold: ramp("#7a4a06", "#c27d0e", "#f0b312", "#ffd93d", "#fff3b0"),
  cloud: ramp("#1e2760", "#28337a", "#36448f", "#4a5aa6", "#6577bd", "#8597d4", "#a9b8ea"),
  smoke: hex("#8d93bf"),
};

/** Ore flecks: [dark, base, glint]. Tier colours from the game's Palette, set in moonlit rock. */
const ORE: Record<string, RGB[]> = {
  coal: ramp("#05060c", "#14161f", "#4a4f66"),
  iron: ramp("#8c6b5a", "#d9b49a", "#fbe7d6"),
  gold: ramp("#c27d0e", "#ffd93d", "#fff3b0"),
  diamond: ramp("#1aa7b8", "#33ffff", "#d8ffff"),
  netherite: ramp("#4a2a22", "#ff6633", "#ffc08a"),
};

// ---------------------------------------------------------------- randomness

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(i: number, seed: number) {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Smooth 1D value noise in [0, 1]. */
function noise(x: number, seed: number) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u;
}
const fbm = (x: number, seed: number) => noise(x, seed) * 0.6 + noise(x * 2.1, seed + 7) * 0.28 + noise(x * 4.3, seed + 13) * 0.12;

// Ordered dithering: the 4×4 Bayer matrix, as thresholds in (0, 1).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
/** A level in [0, n-1] picked from a continuous one, dithering only near each step. */
function stepped(f: number, x: number, y: number, n: number, soft = 0.4) {
  const i = Math.floor(f), fr = f - i;
  const k = fr > 1 - soft && bayer(x, y) < (fr - (1 - soft)) / soft ? i + 1 : i;
  return Math.min(n - 1, Math.max(0, k));
}

// ---------------------------------------------------------------- the canvas

class Canvas {
  w: number; h: number; px: Float32Array;
  constructor(w: number, h: number) { this.w = w; this.h = h; this.px = new Float32Array(w * h * 3); }
  get(x: number, y: number): RGB { const i = (y * this.w + x) * 3; return [this.px[i], this.px[i + 1], this.px[i + 2]]; }
  set(x: number, y: number, c: RGB) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.px[i] = c[0]; this.px[i + 1] = c[1]; this.px[i + 2] = c[2];
  }
  blend(x: number, y: number, c: RGB, a: number) {
    x = Math.round(x); y = Math.round(y);
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.set(x, y, mix(this.get(x, y), c, clamp(a)));
  }
}

/**
 * One island (or any object) drawn on its own before it joins the scene: a colour
 * and a material per pixel, so it can be outlined and hazed as a whole.
 */
class Layer {
  c = new Int32Array(W * H).fill(-1);
  m = new Uint8Array(W * H); // 0 empty, 1 rock (outlined), 2 everything else
  set(x: number, y: number, col: RGB, mat = 2) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    this.c[y * W + x] = (Math.round(col[0]) << 16) | (Math.round(col[1]) << 8) | Math.round(col[2]);
    this.m[y * W + x] = mat;
  }
  has(x: number, y: number) { return x >= 0 && y >= 0 && x < W && y < H && this.c[y * W + x] >= 0; }
  mat(x: number, y: number) { return x >= 0 && y >= 0 && x < W && y < H ? this.m[y * W + x] : 0; }
}

// ---------------------------------------------------------------- the sky

/** Sky level (index into P.sky, continuous) at a pixel: zenith to horizon, lifted around the moon. */
const MOON = { x: 262, y: 30, r: 10 };
function skyLevel(x: number, y: number) {
  const n = P.sky.length;
  let f = (y / 150) ** 0.95 * (n - 1.2);
  f += Math.sin(x * 0.021 + y * 0.01 + 0.7) * 0.35 + Math.sin(x * 0.047 + 2) * 0.15; // slow waves, so the bands aren't ruled lines
  const d = Math.hypot(x - MOON.x, (y - MOON.y) * 1.15);
  f += 3.2 * clamp(1 - d / 64) ** 2.2;
  return clamp(f, 0, n - 1);
}
const skyAt = (x: number, y: number): RGB => {
  const f = skyLevel(x, y), i = Math.floor(f);
  return mix(P.sky[i], P.sky[Math.min(i + 1, P.sky.length - 1)], f - i);
};

function drawSky(cv: Canvas) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    cv.set(x, y, P.sky[stepped(skyLevel(x, y), x, y, P.sky.length)]);
  }
  // The moon's halo: a few stepped rings of pale light, dithered at their edges.
  for (let y = 0; y < 80; y++) for (let x = 190; x < W; x++) {
    const d = Math.hypot(x - MOON.x, y - MOON.y);
    const f = clamp(1 - (d - MOON.r) / 26) * 3;
    const k = stepped(f, x, y, 4, 0.5);
    if (k > 0) cv.blend(x, y, P.moonGlow, [0, 0.05, 0.1, 0.17][k]);
  }
}

/** Aurora curtains: a bright lower hem, vertical rays, fading up from teal into violet. */
interface Ribbon { base: (x: number) => number; height: (x: number) => number; strength: number; x0: number; x1: number; seed: number; hue: number }
function drawAurora(cv: Canvas, ribbons: Ribbon[], calm: (x: number, y: number) => number) {
  for (const r of ribbons) {
    for (let x = Math.max(0, r.x0); x < Math.min(W, r.x1); x++) {
      // Fade the ends in and out.
      const end = clamp((x - r.x0) / 40) * clamp((r.x1 - x) / 40);
      // Rays: fine vertical streaks that drift in brightness across the curtain.
      const rays = 0.45 + 0.55 * (noise(x * 0.42, r.seed) * 0.6 + noise(x * 0.11, r.seed + 3) * 0.4);
      const yb = r.base(x), hgt = r.height(x);
      for (let y = Math.floor(yb - hgt); y <= Math.ceil(yb + 3); y++) {
        if (y < 0 || y >= H) continue;
        let I: number, v: number;
        if (y <= yb) { v = (yb - y) / hgt; I = (1 - v) ** 1.7 * (0.55 + 0.45 * rays); }
        else { v = 0; I = clamp(1 - (y - yb) / 3) * 0.45 * rays; }
        I *= end * r.strength * calm(x, y);
        const q = stepped(I * 5, x, y, 6, 0.6);
        if (!q) continue;
        // Teal at the hem, through blue, into violet at the top; `hue` pushes a curtain violet.
        const h = clamp(v * 1.3 + r.hue);
        const col = h < 0.4 ? mix(P.auroraLow, P.auroraMid, h / 0.4) : mix(P.auroraMid, P.auroraHigh, (h - 0.4) / 0.6);
        cv.blend(x, y, col, [0, 0.1, 0.19, 0.29, 0.4, 0.52][q]);
        // A hot core along the hem, where the curtain is brightest.
        if (y === Math.round(yb) && I > 0.62) cv.blend(x, y, P.auroraCore, 0.45);
      }
    }
  }
}

function drawStars(cv: Canvas, rand: () => number, keep: (x: number, y: number) => boolean) {
  const bright: [number, number][] = [];
  for (let i = 0; i < 170; i++) {
    const x = Math.floor(rand() * W), y = Math.floor(rand() ** 1.25 * 128);
    if (!keep(x, y)) continue;
    const b = rand();
    if (b < 0.62) cv.blend(x, y, P.star[1], 0.55 + rand() * 0.3);
    else if (b < 0.9) cv.set(x, y, P.star[2]);
    else cv.set(x, y, P.star[3]);
  }
  // A few bright ones with short crossed rays: the ones the site can make twinkle.
  for (const [x, y, big] of [[38, 20, 1], [118, 12, 0], [178, 34, 1], [214, 15, 0], [300, 56, 0], [92, 52, 0], [150, 96, 0]] as [number, number, number][]) {
    if (!keep(x, y)) continue;
    cv.set(x, y, P.star[3]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) cv.blend(x + dx, y + dy, P.star[2], 0.75);
    if (big) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) cv.blend(x + dx, y + dy, P.star[1], 0.6);
    bright.push([x, y]);
  }
  return bright;
}

function drawMoon(cv: Canvas) {
  const { x: mx, y: my, r } = MOON;
  for (let y = my - r - 1; y <= my + r + 1; y++) for (let x = mx - r - 1; x <= mx + r + 1; x++) {
    const d = Math.hypot(x - mx, y - my);
    if (d > r + 0.3) continue;
    // The crescent: the disc minus a disc shifted toward the upper left.
    const dd = Math.hypot(x - (mx - 4.6), y - (my - 2.4));
    if (dd < r * 0.93) {
      cv.blend(x, y, hex("#3a4590"), 0.35); // the dark limb, faintly lit by the earth
      continue;
    }
    // Brighter toward the outer rim, a warmer shade along the inner edge.
    const inner = dd - r * 0.93;
    const k = inner < 1.2 ? 2 : d > r - 1.1 && x > mx ? 0 : 1;
    cv.set(x, y, P.moon[k]);
  }
  // Two craters, a shade darker.
  for (const [x, y] of [[mx + 6, my + 2], [mx + 5, my + 3], [mx + 2, my + 7], [mx + 7, my - 3]]) cv.set(x, y, P.moon[2]);
}

// ---------------------------------------------------------------- clouds

/**
 * A layer of the cloud sea: rows of billows, each a half-ellipse top with a body
 * hanging below it, drawn back to front so every billow's moonlit rim shows over
 * the one behind. Lit along the top, darkening downward in dithered steps.
 * `fade` pushes the layer toward the sky behind it (farther = fainter).
 */
interface Billow { x: number; y: number; rx: number; ry: number }
function drawClouds(cv: Canvas, billows: Billow[], { fade = 0, dark = 0 }: { fade?: number; dark?: number }) {
  const n = P.cloud.length;
  for (const b of [...billows].sort((p, q) => p.y - q.y)) {
    for (let x = Math.max(0, Math.floor(b.x - b.rx)); x <= Math.min(W - 1, Math.ceil(b.x + b.rx)); x++) {
      const u = (x - b.x) / b.rx;
      if (Math.abs(u) > 1) continue;
      const top = Math.round(b.y - b.ry * Math.sqrt(1 - u * u));
      for (let y = Math.max(0, top); y < H; y++) {
        const d = y - top;
        // The rim catches the moon (up and to the right); below it, the body.
        let f: number;
        if (d === 0) f = u > -0.55 ? n - 1 : n - 2;
        else if (d <= 2) f = u > -0.2 ? n - 2 : n - 3;
        else f = n - 3.3 - (d - 2) * 0.22 - Math.max(0, -u) * 0.7;
        f -= dark;
        const k = stepped(clamp(f, 0, n - 1), x, y, n, 0.28);
        cv.set(x, y, fade ? mix(P.cloud[k], skyAt(x, y), fade) : P.cloud[k]);
      }
    }
  }
}

/** Billows along a gently wavy line from x0 to x1, about `size` wide. */
function bank(rand: () => number, x0: number, x1: number, y: number, size: number, wave = 3): Billow[] {
  const out: Billow[] = [];
  for (let x = x0; x < x1; x += size * (0.75 + rand() * 0.55)) {
    const rx = size * (0.7 + rand() * 0.7);
    out.push({ x, y: y + Math.sin(x * 0.04 + y) * wave + rand() * size * 0.3, rx, ry: rx * (0.42 + rand() * 0.2) });
  }
  return out;
}

// ---------------------------------------------------------------- islands

interface IslandSpec {
  cx: number; top: number;
  /** Half-width of the top. */
  rx: number;
  /** How far the underside hangs below the top. */
  depth: number;
  seed: number;
  ore: keyof typeof ORE;
  ores: number;
  /** 0 is nearest; toward 1 the island fades into the sky. */
  haze: number;
  /** Chunky 2-pixel steps along the underside for the near islands, like stacked blocks. */
  step?: number;
  /** Rock that isn't plain stone (netherite's blackstone). */
  stone?: RGB[];
  /** Things on top: trees, buildings. Gets the surface height at x. */
  dress?: (l: Layer, surface: (x: number) => number, rand: () => number) => void;
}

interface Placed { spec: IslandSpec; surface: (x: number) => number; lip: (x: number) => number; bottom: (x: number) => number }

function island(s: IslandSpec): { layer: Layer; placed: Placed } {
  const l = new Layer(), rand = rng(s.seed);
  const stone = s.stone ?? P.stone;
  const x0 = Math.round(s.cx - s.rx), x1 = Math.round(s.cx + s.rx);
  // The top: nearly flat, a gentle rise, the ends rounded off.
  const surface = (x: number) => {
    const u = (x - s.cx) / s.rx;
    const round = Math.abs(u) > 0.86 ? (Math.abs(u) - 0.86) * 14 : 0;
    return Math.round(s.top - Math.max(0, 1 - u * u) * Math.min(3, s.rx * 0.07) - (fbm(x * 0.12, s.seed) - 0.5) * 2 + round);
  };
  const snowDepth = s.rx > 20 ? 3 : 2, dirtDepth = s.rx > 20 ? 3 : 2;
  const lip = (x: number) => surface(x) + snowDepth + dirtDepth;
  // The underside: a broad cone with stalactite teeth hanging from it.
  const nTeeth = 3 + Math.round(s.rx / 12);
  const teeth = Array.from({ length: nTeeth }, (_, i) => ({
    c: s.cx + ((i + 0.5) / nTeeth - 0.5) * s.rx * 1.5 + (rand() - 0.5) * s.rx * 0.25,
    w: s.rx * (0.16 + rand() * 0.18),
    h: s.depth * (0.55 + rand() * 0.4) * (1 - Math.abs((i + 0.5) / nTeeth - 0.5) * 0.8),
  }));
  // The deepest point, a little off-centre.
  teeth.push({ c: s.cx + (rand() - 0.5) * s.rx * 0.3, w: s.rx * 0.32, h: s.depth });
  const step = s.step ?? 1;
  const dropAt = (x: number) => {
    const u = (x - s.cx) / s.rx;
    let d = Math.max(0, 1 - Math.abs(u) ** 1.5) ** 1.15 * s.depth * (0.5 + 0.22 * fbm(x * 0.08, s.seed + 3)) + (Math.abs(u) <= 1 ? 2 : 0);
    let owner = -1;
    teeth.forEach((t, i) => {
      const k = 1 - Math.abs(x - t.c) / t.w;
      if (k <= 0) return;
      const td = t.h * k ** 1.1;
      if (td > d) { d = td; owner = i; }
    });
    d += (fbm(x * 0.3, s.seed + 5) - 0.5) * 3 + (hash(Math.floor(x / 3), s.seed + 8) - 0.5) * 2.5;
    return { d, owner };
  };
  const bottom = (x: number) => {
    const sx = step > 1 ? Math.floor((x - x0) / step) * step + x0 + step / 2 : x;
    return lip(x) + Math.max(1, Math.round(dropAt(sx).d));
  };

  // Strata: the rock is laid in beds a few pixels thick, each with a broken seam.
  const bedY = (x: number, y: number) => y - lip(x) + Math.round((fbm(x * 0.06, s.seed + 9) - 0.5) * 4);
  const bots = new Map<number, number>();
  for (let x = x0; x <= x1; x++) bots.set(x, bottom(x));
  /** The run of rock on row y that contains x. */
  const runAt = (x: number, y: number): [number, number] => {
    let a = x, b = x;
    while (a > x0 && bots.get(a - 1)! >= y) a--;
    while (b < x1 && bots.get(b + 1)! >= y) b++;
    return [a, b];
  };
  for (let x = x0; x <= x1; x++) {
    const top = surface(x), lp = lip(x), bt = bots.get(x)!;
    const { owner } = dropAt(x);
    const t = owner >= 0 ? teeth[owner] : null;
    for (let y = top; y <= bt; y++) {
      if (y < top + snowDepth) {
        // Snow: bright on top, its front edge in shade.
        const k = y === top ? (x > s.cx - s.rx * 0.3 ? 4 : 3) : y === top + snowDepth - 1 ? 1 : 2;
        l.set(x, y, P.snow[k]);
      } else if (y < lp) {
        // A band of frozen dirt under the snow; the lit side a step warmer.
        const k = y === lp - 1 ? 0 : x > s.cx ? 2 : 1;
        l.set(x, y, P.dirt[k], 1);
      } else {
        // Stone. The face toward the moon (the right of each tooth) is lit; the
        // overhang under the lip is in shadow; the tips catch a little light
        // from the clouds below.
        // Shade it as a rounded mass: across each row's run of rock, dark on the
        // side away from the moon, lit toward it, with each tooth adding its own
        // facet. Facet edges wobble in 2-pixel blocks so they read as chiselled.
        const [rl, rr] = runAt(x, y);
        const half = Math.max(1.5, (rr - rl) / 2), nx = (x - (rl + rr) / 2) / half;
        const tooth = t ? (x >= t.c ? 0.22 : -0.22) * clamp((y - lp) / 6) : 0;
        const v = 0.66 * nx + tooth + 0.08 + (fbm(x * 0.21 + y * 0.09, s.seed + 2) - 0.5) * 0.36;
        let k = v < -0.5 ? 1 : v < -0.08 ? 2 : v < 0.38 ? 3 : 4;
        if (v > 0.72 && rr - x > 1) k = 5;
        const under = y - lp;
        if (under < 2) k = Math.min(k, under === 0 ? 1 : 2); // shadow under the lip
        if (bt - y < 1 && under > 3 && k < 4) k += 1; // the tips catch the cloud light
        const bed = bedY(x, y);
        if (bed > 2 && bed % 5 === 0 && hash(x >> 2, s.seed + bed) < 0.55 && k > 1) k -= 1;
        l.set(x, y, stone[clamp(k, 1, stone.length - 1)], 1);
      }
    }
    // Snow drips over the dirt here and there.
    if (hash(x, s.seed + 1) < 0.22) l.set(x, top + snowDepth, P.snow[1]);
  }
  // Lit highlight down the lit edge of the deepest tooth.
  // Ore: small clusters set into the stone, away from the edges.
  const ore = ORE[s.ore];
  let placedOre = 0, tries = 0;
  while (placedOre < s.ores && tries++ < 400) {
    const x = Math.round(s.cx + (rand() - 0.5) * s.rx * 1.5);
    const y = Math.round(lip(x) + 3 + rand() * (bottom(x) - lip(x) - 6));
    const shape = [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 1], [2, 1]].slice(0, 2 + Math.floor(rand() * 3));
    if (!shape.every(([dx, dy]) => l.mat(x + dx, y + dy) === 1 && l.mat(x + dx, y + dy + 1) === 1 && l.mat(x + dx - 1, y + dy) === 1 && l.mat(x + dx + 1, y + dy) === 1 && y + dy > lip(x + dx) + 1)) continue;
    shape.forEach(([dx, dy], i) => l.set(x + dx, y + dy, ore[i === 0 ? 2 : i === shape.length - 1 ? 0 : 1], 3));
    placedOre++;
  }
  s.dress?.(l, surface, rand);
  return { layer: l, placed: { spec: s, surface, lip, bottom } };
}

/** Adds a layer to the scene: rock gets a dark outline, then everything is hazed by depth. */
function composite(cv: Canvas, l: Layer, haze: number, outline: RGB = P.stone[0]) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (l.c[i] < 0) continue;
    let c: RGB = [(l.c[i] >> 16) & 255, (l.c[i] >> 8) & 255, l.c[i] & 255];
    const m = l.m[i];
    if ((m === 1 || m === 3) && (!l.has(x - 1, y) || !l.has(x + 1, y) || !l.has(x, y + 1))) c = outline;
    if (haze > 0) {
      // Toward the sky's colour behind it, lifted a little (the air glows).
      const sky = mix(skyAt(x, y), hex("#4a54a0"), 0.25);
      c = mix(c, sky, haze);
    }
    cv.set(x, y, c);
  }
}

// ---------------------------------------------------------------- what stands on the islands

/** A snowy pine, `h` tall, its trunk's foot at (x, y). */
function pine(l: Layer, x: number, y: number, h: number, rand: () => number) {
  const tiers = h >= 12 ? 4 : h >= 8 ? 3 : 2;
  const trunk = h >= 9 ? 2 : 1;
  for (let i = 0; i < trunk; i++) l.set(x, y - i, P.wood[1]);
  const crownH = h - trunk;
  const tierH = crownH / tiers;
  for (let r = 0; r < crownH; r++) {
    const yy = y - trunk - r;
    const fromTop = crownH - 1 - r;
    const tier = Math.min(tiers - 1, Math.floor(fromTop / tierH));
    const inTier = fromTop - tier * tierH;
    // Each tier flares out at its foot; lower tiers are wider.
    const half = Math.round((tier + 1) * 0.9 + inTier * 0.55 * (h / 12 + 0.5));
    for (let dx = -half; dx <= half; dx++) {
      const edge = Math.abs(dx) === half;
      let k = dx > 0 ? 2 : 1;
      if (dx > 0 && dx === half - 1) k = 3;
      if (edge) k = dx > 0 ? 2 : 0;
      l.set(x + dx, yy, P.pine[k]);
    }
    // Snow along the top of each tier, heavier on the lit side.
    if (Math.floor(inTier) === 0 || r === crownH - 1) {
      for (let dx = -half + 1; dx <= half; dx++) if (dx > -half + 1 || rand() < 0.5) l.set(x + dx, yy, P.snow[dx > 0 ? 3 : 2]);
    } else if (Math.floor(inTier) === 1 && half > 1) {
      l.set(x + half - 1, yy, P.snow[2]);
      if (rand() < 0.5) l.set(x - half + 1, yy, P.snow[1]);
    }
  }
  l.set(x, y - h, P.snow[4]);
}

/** A small gold glow around (x, y): dithered rings, brightest in the middle. */
function glow(cv: Canvas, x: number, y: number, r: number, strength: number, col: RGB = P.gold[3]) {
  for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
    const d = Math.hypot(xx - x, (yy - y) * 1.1) / r;
    if (d >= 1) continue;
    const k = stepped((1 - d) ** 1.6 * 3, xx, yy, 4, 0.35);
    if (k) cv.blend(xx, yy, col, [0, 0.12, 0.24, 0.4][k] * strength);
  }
}

// ---------------------------------------------------------------- the scene

/** The whole scene at 1×, 320×180, as linear RGB floats in a Canvas. */
export function paintScene(): { canvas: Canvas; twinkles: [number, number][] } {
  const cv = new Canvas(W, H);
  const rand = rng(2026);
  drawSky(cv);

  // The wordmark's sky: the aurora thins and the stars thin out across the middle.
  const calm = (x: number, y: number) => 1 - 0.45 * clamp(1 - Math.hypot((x - 160) / 95, (y - 74) / 32));
  const twinkles = drawStars(cv, rand, (x, y) => Math.hypot(x - MOON.x, y - MOON.y) > MOON.r + 6 && (Math.hypot((x - 160) / 80, (y - 72) / 24) > 1 || hash(x * 7 + y, 3) < 0.25));
  drawAurora(cv, [
    // The main curtain: high on the left, dipping through the middle, rising off right.
    { base: (x) => 44 - 16 * Math.sin((x / W) * Math.PI * 1.15 + 0.35) + 3 * Math.sin(x * 0.045), height: (x) => 22 + 10 * fbm(x * 0.03, 4), strength: 1, x0: -20, x1: 300, seed: 11, hue: 0 },
    // A fainter, more violet one behind it, higher on the right.
    { base: (x) => 18 + 8 * Math.sin(x * 0.018 + 2.4) + 2 * Math.sin(x * 0.07), height: () => 16, strength: 0.6, x0: 120, x1: 340, seed: 23, hue: 0.35 },
    // A short low curtain on the left, over the diamond island.
    { base: (x) => 70 + 4 * Math.sin(x * 0.05), height: () => 14, strength: 0.45, x0: -10, x1: 120, seed: 31, hue: 0.15 },
  ], calm);
  drawMoon(cv);

  // The far cloud bank on the horizon, then the far islands over it.
  drawClouds(cv, [...bank(rng(5), -10, W + 10, 140, 14, 2), ...bank(rng(6), -10, W + 10, 147, 11, 2)], { fade: 0.62, dark: 0.6 });

  const islands: Placed[] = [];
  const add = (s: IslandSpec, outline = s.haze < 0.5) => {
    const { layer, placed } = island(s);
    composite(cv, layer, s.haze, outline ? P.stone[0] : (s.stone ?? P.stone)[1]);
    islands.push(placed);
    return placed;
  };

  // Netherite: the farthest, high under the moon, blackstone with embers.
  const nether = add({ cx: 300, top: 70, rx: 10, depth: 13, seed: 41, ore: "netherite", ores: 5, haze: 0.36, stone: ramp("#0a0712", "#1a1228", "#2a1e3a", "#3b2a4c", "#523a60", "#6c5078") });
  glow(cv, 300, nether.bottom(300) - 2, 11, 0.45, ORE.netherite[1]);
  // Diamond: far, high on the left.
  add({ cx: 36, top: 76, rx: 13, depth: 16, seed: 37, ore: "diamond", ores: 4, haze: 0.48, dress: (l, s, r) => { pine(l, 30, s(30) - 1, 7, r); pine(l, 41, s(41) - 1, 5, r); } });

  // KOTH: beside iron, its tower and flag above the route.
  const koth = add({
    cx: 236, top: 100, rx: 15, depth: 20, seed: 29, ore: "iron", ores: 2, haze: 0.38,
    dress: (l, s) => {
      const bx = 236, by = s(236) - 1;
      // The tower: a stone keep, crenellated, a lit slit window.
      for (let y = by - 15; y <= by; y++) for (let x = bx - 3; x <= bx + 3; x++) {
        const k = x === bx - 3 ? 1 : x >= bx + 1 ? 4 : 3;
        const mortar = (y - by) % 3 === 0 && ((x + Math.floor((y - by) / 3)) & 1) === 0;
        l.set(x, y, P.stone[mortar ? k - 1 : k], 2);
      }
      for (let x = bx - 4; x <= bx + 4; x++) l.set(x, by - 16, P.snow[x > bx ? 3 : 2]);
      for (const x of [bx - 4, bx - 2, bx, bx + 2, bx + 4]) { l.set(x, by - 17, P.stone[x > bx ? 4 : 3]); l.set(x, by - 18, P.snow[3]); }
      l.set(bx, by - 10, P.gold[3]); l.set(bx, by - 9, P.gold[2]);
      l.set(bx - 1, by - 4, P.gold[2]); l.set(bx - 1, by - 3, P.gold[1]); l.set(bx, by - 4, P.gold[3]); l.set(bx, by - 3, P.gold[2]);
      // The flag: a pole and a gold pennant in the wind.
      for (let y = by - 26; y <= by - 18; y++) l.set(bx, y, P.wood[3]);
      const flag = [[1, 0, 4], [2, 0, 3], [3, 0, 3], [4, 1, 3], [1, 1, 3], [2, 1, 3], [3, 1, 2], [1, 2, 2], [2, 2, 2], [5, 1, 2]];
      for (const [dx, dy, k] of flag) l.set(bx + dx, by - 26 + dy, P.gold[k]);
      // Snow on the ground around it.
      pine(l, 226, s(226) - 1, 6, rng(3));
    },
  });

  // The route's mid islands over a lower bank of cloud.
  drawClouds(cv, bank(rng(9), 100, 250, 152, 10, 2), { fade: 0.4, dark: 0.4 });
  const iron = add({ cx: 196, top: 120, rx: 21, depth: 27, seed: 19, ore: "iron", ores: 5, haze: 0.22, dress: (l, s, r) => { pine(l, 182, s(182) - 1, 9, r); pine(l, 189, s(189) - 1, 6, r); pine(l, 210, s(210) - 1, 8, r); } });
  const coal = add({ cx: 136, top: 138, rx: 17, depth: 21, seed: 17, ore: "coal", ores: 5, haze: 0.26, stone: ramp("#0b1028", "#1d2550", "#2e3a6c", "#41508a", "#5a6ca6", "#7486bd"), dress: (l, s, r) => { pine(l, 128, s(128) - 1, 7, r); pine(l, 145, s(145) - 1, 9, r); } });
  void iron; void coal; void koth;

  // Gold: near, on the right, its mine glowing.
  const gold = add({
    cx: 286, top: 108, rx: 42, depth: 50, seed: 13, ore: "gold", ores: 9, haze: 0.04, step: 2,
    dress: (l, s, r) => {
      pine(l, 300, s(300) - 1, 14, r); pine(l, 310, s(310) - 1, 10, r); pine(l, 258, s(258) - 1, 8, r); pine(l, 318, s(318) - 1, 12, r);
      // A minecart track to the edge.
    },
  });
  {
    // The mine: a timbered mouth in the rock face under the lip, gold light inside.
    const mx = 270, my = gold.lip(270) + 1;
    const l = new Layer();
    for (let y = my; y < my + 9; y++) for (let x = mx - 4; x <= mx + 4; x++) {
      const inside = Math.abs(x - mx) <= 2 && y > my;
      if (Math.abs(x - mx) === 3 || Math.abs(x - mx) === 4 && y > my) l.set(x, y, P.wood[Math.abs(x - mx) === 3 ? 3 : 1]);
      else if (y === my) l.set(x, y, P.wood[x > mx ? 3 : 2]);
      else if (inside) {
        const depth = (y - my) / 8;
        l.set(x, y, P.gold[y === my + 8 ? 3 : depth > 0.55 ? 2 + (x === mx ? 1 : 0) : Math.abs(x - mx) === 2 ? 0 : 1]);
      }
    }
    for (let x = mx - 5; x <= mx + 5; x++) l.set(x, my - 1, P.snow[x > mx ? 3 : 2]);
    composite(cv, l, 0.04);
    glow(cv, mx, my + 6, 16, 0.9);
    // Light spills out over the rock below the mouth.
    glow(cv, mx, my + 13, 9, 0.5);
  }

  // The hub: the nearest and biggest, on the left: a cabin, lanterns, pines.
  const hubSmoke: [number, number] = [0, 0];
  const lights: [number, number][] = [];
  const hub = add({
    cx: 64, top: 114, rx: 54, depth: 56, seed: 7, ore: "coal", ores: 0, haze: 0, step: 2,
    dress: (l, s, r) => {
      pine(l, 20, s(20) - 1, 16, r); pine(l, 30, s(30) - 1, 11, r); pine(l, 13, s(13) - 1, 9, r);
      pine(l, 98, s(98) - 1, 15, r); pine(l, 108, s(108) - 1, 10, r);
      // The cabin: spruce walls, a snowed-over roof, a chimney, lit windows.
      const cx = 62, base = s(62) - 1, w = 10;
      for (let y = base - 7; y <= base; y++) for (let x = cx - w; x <= cx + w; x++) {
        const log = (base - y) % 2 === 0;
        l.set(x, y, P.wood[x > cx ? (log ? 3 : 2) : log ? 2 : 1]);
      }
      // Corner posts.
      for (let y = base - 7; y <= base; y++) { l.set(cx - w, y, P.wood[0]); l.set(cx + w, y, P.wood[3]); }
      // Roof: a gable of snow over a dark eave.
      for (let r2 = 0; r2 <= 8; r2++) {
        const y = base - 8 - r2, half = w + 2 - r2;
        for (let x = cx - half; x <= cx + half; x++) {
          const k = r2 === 0 ? 0 : x === cx - half ? 1 : x >= cx ? (x === cx + half ? 2 : 4) : 3;
          l.set(x, y, r2 === 0 ? P.wood[0] : P.snow[k]);
        }
      }
      for (const x of [cx - w - 1, cx - w + 3, cx + 2, cx + w - 2, cx + w + 1]) l.set(x, base - 7, P.snow[1]); // icicles
      // Chimney on the right slope.
      for (let y = base - 18; y <= base - 12; y++) for (let x = cx + 5; x <= cx + 7; x++) l.set(x, y, P.stone[x === cx + 7 ? 4 : 3], 2);
      for (let x = cx + 4; x <= cx + 8; x++) l.set(x, base - 19, P.snow[3]);
      hubSmoke[0] = cx + 6; hubSmoke[1] = base - 20;
      // Windows (gold, framed) and the door.
      for (const wx of [cx - 7, cx + 4]) {
        for (let y = base - 5; y <= base - 2; y++) for (let x = wx; x <= wx + 3; x++) {
          const frame = y === base - 5 || y === base - 2 || x === wx || x === wx + 3;
          l.set(x, y, frame ? P.wood[0] : P.gold[y === base - 4 ? 4 : 3]);
        }
        lights.push([wx + 1.5, base - 3.5]);
      }
      for (let y = base - 5; y <= base; y++) for (let x = cx - 2; x <= cx; x++) l.set(x, y, x === cx - 2 || y === base - 5 ? P.wood[0] : P.wood[1]);
      l.set(cx, base - 2, P.gold[3]);
      // Lantern posts along the path.
      for (const lx of [40, 84]) {
        const ly = s(lx) - 1;
        for (let y = ly - 5; y <= ly; y++) l.set(lx, y, P.wood[1]);
        l.set(lx, ly - 6, P.gold[4]); l.set(lx - 1, ly - 6, P.gold[2]); l.set(lx + 1, ly - 6, P.gold[2]); l.set(lx, ly - 7, P.wood[0]);
        lights.push([lx, ly - 6]);
      }
      // A string of festive lights from the cabin eave to the right lantern.
      for (let x = cx + w + 2; x < 84; x++) {
        const t = (x - (cx + w + 2)) / (84 - (cx + w + 2));
        const y = Math.round(base - 8 + (s(84) - 7 - (base - 8)) * t + Math.sin(t * Math.PI) * 2);
        l.set(x, y, P.wood[0]);
        if ((x & 1) === 0) l.set(x, y + 1, [P.gold[3], hex("#ff5d6c"), hex("#3cf2c6"), hex("#ffffff")][(x >> 1) % 4]);
      }
    },
  });
  for (const [x, y] of lights) glow(cv, x, y, 7, 0.8);
  // Window light pooled on the snow in front.
  glow(cv, 62, hub.surface(62) + 1, 13, 0.45);
  {
    // Smoke: puffs from the chimney, growing and thinning as they drift right
    // on the wind: solid near the chimney, broken up by dithering as it thins.
    const [sx, sy] = hubSmoke;
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const px = sx + t * 15 + Math.sin(t * 4) * 1.5, py = sy - 1 - t * 20, pr = 1.3 + t * 3;
      for (let y = Math.floor(py - pr); y <= py + pr; y++) for (let x = Math.floor(px - pr); x <= px + pr; x++) {
        if (Math.hypot(x - px, y - py) > pr) continue;
        const edge = Math.hypot(x - px, y - py) > pr - 1;
        if (edge && t > 0.25 && bayer(x, y) > 0.5) continue;
        cv.blend(x, y, y < py && x >= px ? hex("#c9cee9") : P.smoke, 0.7 - t * 0.45);
      }
    }
  }

  // The near sea of cloud, over the islands' lowest tips.
  drawClouds(cv, [...bank(rng(12), -20, W + 20, 163, 26, 4), ...bank(rng(13), -10, W + 20, 177, 22, 3)], { dark: 0.5 });

  // Falling snow, in front of everything.
  const snow = rng(99);
  for (let i = 0; i < 240; i++) {
    const x = Math.floor(snow() * W), y = Math.floor(snow() * H);
    const near = snow();
    if (near < 0.1) { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cv.blend(x + dx, y + dy, P.snow[4], dx + dy === 0 ? 0.95 : 0.75); }
    else if (near < 0.55) cv.blend(x, y, P.snow[4], 0.85);
    else cv.blend(x, y, P.snow[2], 0.45);
  }
  return { canvas: cv, twinkles };
}

// ---------------------------------------------------------------- output

/** Nearest-neighbour upscale (and optional crop, in 1× pixels) into packed RGB bytes. */
function upscale(cv: Canvas, s: number, crop = { x: 0, y: 0, w: cv.w, h: cv.h }) {
  const w = crop.w * s, h = crop.h * s, out = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const sy = crop.y + Math.floor(y / s);
    for (let x = 0; x < w; x++) {
      const i = ((sy * cv.w) + crop.x + Math.floor(x / s)) * 3, o = (y * w + x) * 3;
      out[o] = Math.round(cv.px[i]); out[o + 1] = Math.round(cv.px[i + 1]); out[o + 2] = Math.round(cv.px[i + 2]);
    }
  }
  return { w, h, rgb: out };
}

/** Gaussian-ish blur (three box passes), edges clamped, on packed RGB bytes. */
function blur(img: { w: number; h: number; rgb: Uint8Array }, radius: number) {
  const { w, h } = img;
  let a = Float32Array.from(img.rgb), b = new Float32Array(a.length);
  const pass = (src: Float32Array, dst: Float32Array, r: number, horizontal: boolean) => {
    const n = horizontal ? w : h, lines = horizontal ? h : w;
    for (let line = 0; line < lines; line++) {
      const at = (k: number) => (horizontal ? line * w + Math.min(n - 1, Math.max(0, k)) : Math.min(n - 1, Math.max(0, k)) * w + line) * 3;
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) sum += src[at(k) + c];
        for (let k = 0; k < n; k++) {
          dst[at(k) + c] = sum / (2 * r + 1);
          sum += src[at(k + r + 1) + c] - src[at(k - r) + c];
        }
      }
    }
  };
  for (let i = 0; i < 3; i++) {
    pass(a, b, radius, true); [a, b] = [b, a];
    pass(a, b, radius, false); [a, b] = [b, a];
  }
  return { w, h, rgb: Uint8Array.from(a, (v) => Math.round(v)) };
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf: Uint8Array) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Uint8Array) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** Encodes packed RGB as a PNG: indexed when it has 256 colours or fewer (pixel art usually does). */
export function encodePng({ w, h, rgb }: { w: number; h: number; rgb: Uint8Array }) {
  const index = new Map<number, number>();
  for (let i = 0; i < rgb.length && index.size <= 256; i += 3) {
    const k = (rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2];
    if (!index.has(k)) index.set(k, index.size);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  let raw: Buffer, extra: Buffer[] = [];
  if (index.size <= 256) {
    ihdr[8] = 8; ihdr[9] = 3;
    const plte = Buffer.alloc(index.size * 3);
    for (const [k, i] of index) { plte[i * 3] = k >> 16; plte[i * 3 + 1] = (k >> 8) & 255; plte[i * 3 + 2] = k & 255; }
    extra = [chunk("PLTE", plte)];
    raw = Buffer.alloc((w + 1) * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      raw[y * (w + 1) + 1 + x] = index.get((rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2])!;
    }
  } else {
    ihdr[8] = 8; ihdr[9] = 2;
    // Each row gets whichever standard filter leaves the smallest residuals
    // (the usual heuristic: least sum of absolute values).
    const stride = w * 3;
    raw = Buffer.alloc((stride + 1) * h);
    const row = new Uint8Array(stride);
    for (let y = 0; y < h; y++) {
      let best = Infinity;
      for (let ft = 0; ft < 5; ft++) {
        let sum = 0;
        for (let x = 0; x < stride; x++) {
          const v = rgb[y * stride + x];
          const a = x >= 3 ? rgb[y * stride + x - 3] : 0, b = y > 0 ? rgb[(y - 1) * stride + x] : 0, c = x >= 3 && y > 0 ? rgb[(y - 1) * stride + x - 3] : 0;
          let pred = 0;
          if (ft === 1) pred = a; else if (ft === 2) pred = b; else if (ft === 3) pred = (a + b) >> 1;
          else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
          const r = (v - pred) & 255;
          row[x] = r;
          sum += r < 128 ? r : 256 - r;
        }
        if (sum < best) {
          best = sum;
          raw[y * (stride + 1)] = ft;
          raw.set(row, y * (stride + 1) + 1);
        }
      }
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), ...extra,
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", new Uint8Array(0)),
  ]);
}

/** The key art: the scene blurred, the season's wordmark over it with a soft shadow. */
function keyArt(cv: Canvas, wordmarkSvg: string) {
  const bg = blur(upscale(cv, 6), 9);
  const [, vw, vh] = wordmarkSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.map(Number) as number[];
  const inner = wordmarkSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const w = 1920, h = 1080, lw = 1240, lh = (lw * vh) / vw, cy = h * 0.44;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><radialGradient id="ka-shade"><stop offset="0" stop-color="#050816" stop-opacity="0.5"/><stop offset="1" stop-color="#050816" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ka-halo"><stop offset="0" stop-color="#FFD93D" stop-opacity="0.16"/><stop offset="1" stop-color="#FFD93D" stop-opacity="0"/></radialGradient></defs>` +
    `<image width="${w}" height="${h}" href="data:image/png;base64,${encodePng(bg).toString("base64")}"/>` +
    `<ellipse cx="${w / 2}" cy="${cy + lh * 0.12}" rx="${lw * 0.62}" ry="${lh * 1.25}" fill="url(#ka-shade)"/>` +
    `<ellipse cx="${w / 2}" cy="${cy}" rx="${lw * 0.6}" ry="${lh * 0.95}" fill="url(#ka-halo)"/>` +
    `<svg x="${(w - lw) / 2}" y="${(cy - lh / 2).toFixed(2)}" width="${lw}" height="${lh.toFixed(2)}" viewBox="0 0 ${vw} ${vh}">${inner}</svg></svg>`;
  const img = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
  const rgba = img.pixels, rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) { rgb[j] = rgba[i]; rgb[j + 1] = rgba[i + 1]; rgb[j + 2] = rgba[i + 2]; }
  return { w, h, rgb };
}

let painted: ReturnType<typeof paintScene> | undefined;
const scene = () => (painted ??= paintScene());

/** The scene at 1× (or a crop of it, in 1× pixels) as a base64 PNG, for SVGs to scale up with `image-rendering`. */
export function scenePng(crop = { x: 0, y: 0, w: W, h: H }) {
  return encodePng(upscale(scene().canvas, 1, crop)).toString("base64");
}

/** Writes the season's scene files into airfields/themes/<id>/. The key art uses the wordmark.svg already there. */
export function buildAirfieldsScene(root: string, themeId = "winter") {
  const dir = path.join(root, "airfields/themes", themeId);
  const { canvas, twinkles } = scene();
  const write = (name: string, img: { w: number; h: number; rgb: Uint8Array }) => fs.writeFileSync(path.join(dir, name), encodePng(img));
  write("scene-320x180.png", upscale(canvas, 1));
  write("scene.png", upscale(canvas, 4));
  write("scene-1920x1080.png", upscale(canvas, 6));
  // The banner: a 320×100 band through the islands' tops, at 12×.
  write("banner-scene.png", upscale(canvas, 12, BANNER_CROP));
  write("key-art.png", keyArt(canvas, fs.readFileSync(path.join(dir, "wordmark.svg"), "utf8")));
  // Where the bright stars are (1× pixels), for sites that make them twinkle.
  fs.writeFileSync(path.join(dir, "scene.json"), JSON.stringify({ width: W, height: H, twinkles }, null, 2) + "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  buildAirfieldsScene(path.resolve(import.meta.dirname, ".."));
  console.log("wrote the airfields scene");
}
