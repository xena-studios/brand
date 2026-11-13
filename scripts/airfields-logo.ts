// The Airfields title lettering: chunky block letters like a game's title screen.
// Each letter is drawn on a grid of cells (7 wide, 10 tall; I is 3, L is 6), so
// the shapes are exact and never come from a font. Then, like the owner's
// original artwork:
//
// - the face is lit gold, pale at the top to deep gold at the foot, in two bands;
// - every edge of the face has a mitred bevel: pale on edges facing up, peach on
//   edges facing down, orange facing left, darker orange facing right (so holes
//   cut into the face read as recessed);
// - the face leans out toward the bottom in perspective, about the word's centre;
// - a deep brown extrusion hangs under the baseline, narrowing toward the back;
// - one thick maroon outline wraps the whole solid.
//
// A season can cut an emblem into the A (snowflake below is an example). The permanent A
// has a plain face. Returns SVG markup with its top-left at (0, 0).

// Measured from the owner's artwork, in face heights (the face is 10 rows tall).
const ROWS = 10;
const CELL_W = 1.1376;        // a cell's width over its height
const LEAN = 0.052;           // the face is this much wider at the foot than at the top
const DEPTH = 0.3;            // the extrusion's depth, in face heights
const BACK = 0.95;            // the extrusion's back, scaled toward the centre
const OUTLINE = 0.078;        // the outline's width, in face heights
const BEVEL = 0.034;          // the bevel's width, in face heights

export const logoColors = {
  "face-top": "#FFF782",
  "face-mid": "#F8D94F",
  "face-low": "#F6D244",
  "face-foot": "#E69A0D",
  "bevel-up": "#FFEFCB",
  "bevel-down": "#FEE09A",
  "bevel-left": "#D16B0C",
  "bevel-right": "#BF5A08",
  extrusion: "#661F0D",
  outline: "#3F0F0F",
};
const L = logoColors;

// The letters, row by row: # is face. Cut-outs and counters are drawn as the
// owner drew them (the R's notch, the D's clipped corners).
const GLYPHS: Record<string, string[]> = {
  A: ["#######", "#######", "###.###", "###.###", "#######", "#######", "###.###", "###.###", "###.###", "###.###"],
  I: Array(10).fill("###"),
  R: ["#######", "#######", "###.###", "###.###", "######.", "#######", "###.###", "###.###", "###.###", "###.###"],
  F: ["#######", "#######", "###....", "###....", "#######", "#######", "###....", "###....", "###....", "###...."],
  E: ["#######", "#######", "###....", "###....", "#######", "#######", "###....", "###....", "#######", "#######"],
  L: ["###...", "###...", "###...", "###...", "###...", "###...", "###...", "###...", "######", "######"],
  D: ["######.", "#######", "###.###", "###.###", "###.###", "###.###", "###.###", "###.###", "#######", "######."],
  S: ["#######", "#######", "###....", "###....", "#######", "#######", "....###", "....###", "#######", "#######"],
};

/** A rectangle in quarter-cells, relative to the A's face centre. */
export type Rect = [x0: number, y0: number, x1: number, y1: number];

/**
 * An example emblem: a blocky snowflake cut into the A, in quarter-cells about the
 * A's centre: an upright cross two quarter-cells thick, a diagonal cross in
 * chunky overlapping steps, a nub across each upright tip, and a square hub.
 */
export const snowflake: Rect[] = (() => {
  const r: Rect[] = [[-3, -3, 3, 3], [-1, -10, 1, 10], [-10, -1, 10, 1], [-2, -10, 2, -8], [-2, 8, 2, 10], [-10, -2, -8, 2], [8, -2, 10, 2]];
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (const k of [3, 5]) {
      const a = k * sx, b = (k + 3) * sx, c = k * sy, d = (k + 3) * sy;
      r.push([Math.min(a, b), Math.min(c, d), Math.max(a, b), Math.max(c, d)]);
    }
  }
  return r;
})();

const SUB = 4; // quarter-cells: the emblem's and the snow's resolution
// Winter's snow on the lettering: a bright top, a cool body and a shaded underside.
const SNOW = { top: "#FFFFFF", body: "#E6F1FF", shade: "#A9C4E6" };
const f = (n: number) => +n.toFixed(2);

type Pt = [number, number];
interface Contour { pts: Pt[]; normals: Pt[] }

/** Traces the boundary of the filled cells of a grid into closed rectilinear contours. */
function trace(filled: (i: number, j: number) => boolean, w: number, h: number): Contour[] {
  // Directed edges, clockwise around each filled cell (y down), keyed by their start.
  const edges = new Map<string, { to: Pt; n: Pt }[]>();
  const add = (a: Pt, b: Pt, n: Pt) => {
    const k = `${a[0]},${a[1]}`;
    if (!edges.has(k)) edges.set(k, []);
    edges.get(k)!.push({ to: b, n });
  };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!filled(i, j)) continue;
    if (!filled(i, j - 1)) add([i, j], [i + 1, j], [0, -1]);
    if (!filled(i + 1, j)) add([i + 1, j], [i + 1, j + 1], [1, 0]);
    if (!filled(i, j + 1)) add([i + 1, j + 1], [i, j + 1], [0, 1]);
    if (!filled(i - 1, j)) add([i, j + 1], [i, j], [-1, 0]);
  }
  const out: Contour[] = [];
  for (const [startKey, list] of [...edges.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    while (list.length) {
      const pts: Pt[] = [], normals: Pt[] = [];
      let at = startKey.split(",").map(Number) as Pt;
      let e = list.shift()!;
      for (;;) {
        // Merge straight runs into one edge.
        if (normals.length && normals.at(-1)![0] === e.n[0] && normals.at(-1)![1] === e.n[1]) { /* continue the run */ }
        else { pts.push(at); normals.push(e.n); }
        at = e.to;
        const next = edges.get(`${at[0]},${at[1]}`);
        if (!next || !next.length) break;
        // At a pinch, keep turning the same way so contours don't cross.
        const pick = next.length > 1 ? next.findIndex((c) => c.n[0] === -e.n[1] && c.n[1] === e.n[0]) : 0;
        e = next.splice(Math.max(0, pick), 1)[0];
      }
      // The run that closed the loop may continue the first edge.
      if (normals.length > 1 && normals[0][0] === normals.at(-1)![0] && normals[0][1] === normals.at(-1)![1]) {
        pts.shift(); normals.shift();
      }
      out.push({ pts, normals });
    }
  }
  return out;
}

export interface Lettering { svg: string; width: number; height: number }

/**
 * Sets `str` in the title lettering, the face `size` tall. `emblem` cuts a theme's
 * emblem into each A. `snow` piles blocky snow on every top edge (a theme layer).
 * `plain` drops the bevels, emblem and snow, for the smallest sizes.
 */
export function lettering(str: string, size: number, { emblem, snow = false, plain = false, idPrefix = "afl" }: { emblem?: Rect[]; snow?: boolean; plain?: boolean; idPrefix?: string } = {}): Lettering {
  const ch = size / ROWS, cw = ch * CELL_W;
  // Lay the letters out on one grid, a cell apart.
  const letters: { ch: string; col: number; w: number }[] = [];
  let col = 0;
  for (const c of str) {
    const g = GLYPHS[c];
    if (!g) throw new Error(`No block letter for "${c}"`);
    letters.push({ ch: c, col, w: g[0].length });
    col += g[0].length + 1;
  }
  const cols = col - 1;
  const cx = (cols * cw) / 2;
  // The face leans out toward its foot, about the word's centre.
  const P = ([u, v]: Pt): Pt => [cx + (u - cx) * (1 + (LEAN * v) / size), v];
  const back = ([x, y]: Pt): Pt => [cx + (x - cx) * BACK, y + DEPTH * size];
  const poly = (pts: Pt[]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
  // The same, wound one way, so overlapping pieces of one path add up (nonzero) and never cancel.
  const solidPoly = (pts: Pt[]) => {
    const area = pts.reduce((s, [x, y], k) => { const [x2, y2] = pts[(k + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0);
    return poly(area < 0 ? [...pts].reverse() : pts);
  };

  let silhouette = "", sweep = "", extrusion = "", faces = "";
  let snowTop = "", snowBody = "", snowShade = "";
  const bevels: Record<string, string> = { up: "", down: "", left: "", right: "" };
  const dirOf = ([nx, ny]: Pt) => (ny < 0 ? "up" : ny > 0 ? "down" : nx < 0 ? "left" : "right");

  for (const lt of letters) {
    const g = GLYPHS[lt.ch];
    const cell = (i: number, j: number) => i >= 0 && j >= 0 && i < lt.w && j < ROWS && g[j][i] === "#";
    // The solid's footprint: the letter, with every counter closed top and bottom
    // filled in (they're in the extrusion's shadow), so the outline runs straight.
    const solid = (i: number, j: number) => cell(i, j) || (i >= 0 && i < lt.w && j >= 0 && j < ROWS &&
      g.slice(0, j).some((r) => r[i] === "#") && g.slice(j + 1).some((r) => r[i] === "#"));
    const at = (i: number, j: number): Pt => [(lt.col + i) * cw, j * ch];
    for (const c of trace(solid, lt.w, ROWS)) {
      const front = c.pts.map((p) => P(at(...p)));
      silhouette += solidPoly(front) + solidPoly(front.map(back));
      front.forEach((p, k) => { const q = front[(k + 1) % front.length]; sweep += solidPoly([p, q, back(q), back(p)]); });
    }
    // The extrusion's visible side: under every stretch of the baseline.
    for (const c of trace(cell, lt.w, ROWS)) {
      c.pts.forEach((p, k) => {
        const q = c.pts[(k + 1) % c.pts.length];
        if (c.normals[k][1] === 1 && p[1] === ROWS) {
          const a = P(at(...p)), b = P(at(...q));
          extrusion += poly([a, b, back(b), back(a)]);
        }
      });
    }
    // The face, at quarter-cell resolution so an emblem can be cut into it.
    const cut = (i: number, j: number) => {
      if (plain || !emblem || lt.ch !== "A") return false;
      const x = i - (lt.w * SUB) / 2, y = j - (7 * SUB) / 2; // the A's face above its legs is 7 rows
      return emblem.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1);
    };
    const face = (i: number, j: number) => cell(Math.floor(i / SUB), Math.floor(j / SUB)) && !cut(i, j);
    const atq = ([i, j]: Pt): Pt => [(lt.col + i / SUB) * cw, (j / SUB) * ch];
    const contours = trace(face, lt.w * SUB, ROWS * SUB);
    faces += contours.map((c) => poly(c.pts.map((p) => P(atq(p))))).join("");
    if (snow && !plain) {
      // Snow on every top edge open to the sky: a drift that rises toward the
      // middle of the run, with a few wide drips down the face. Each run is one
      // stepped shape in quarter-cells, so it stays blocky like the letters.
      for (let j = 0; j < ROWS; j++) {
        let i = 0;
        while (i < lt.w) {
          if (!(cell(i, j) && !solid(i, j - 1))) { i++; continue; }
          const i0 = i;
          while (i < lt.w && cell(i, j) && !solid(i, j - 1)) i++;
          const q0 = i0 * SUB, n = (i - i0) * SUB, y = j * SUB;
          const top: number[] = [], bottom: number[] = [];
          for (let k = 0; k < n; k++) {
            const fromEnd = Math.min(k, n - 1 - k);
            top.push(y - Math.min(3, 1 + fromEnd)); // the drift: 1, 2, then 3 quarters above the edge
            // Drips two quarters wide, in a fixed pattern (the same on every build).
            const pair = Math.floor(k / 2), h = (lt.col * 31 + pair * 17 + j * 7 + q0) % 9;
            const drip = fromEnd < 2 ? 0 : h === 0 ? 4 : h === 3 ? 2 : 0;
            bottom.push(y + 2 + drip);
          }
          // One stepped outline: along the top left to right, back along the bottom.
          const stair = (ys: number[], dy = 0, rev = false) => {
            const pts: Pt[] = [];
            const ks = [...ys.keys()];
            for (const k of rev ? ks.reverse() : ks) {
              const x0 = q0 + k + (rev ? 1 : 0), x1 = q0 + k + (rev ? 0 : 1);
              pts.push([x0, ys[k] + dy], [x1, ys[k] + dy]);
            }
            return pts;
          };
          const shape = (upper: Pt[], lower: Pt[]) => poly([...upper, ...lower].map((p) => P(atq(p))));
          const body = shape(stair(top), stair(bottom, 0, true));
          silhouette += body;
          snowBody += body;
          snowShade += shape(stair(bottom, -1), stair(bottom, 0, true));
          snowTop += shape(stair(top), stair(top, 1, true));
        }
      }
    }
    if (!plain) {
      for (const c of contours) {
        // Cut-outs (contours inside the letter) get a slightly finer bevel, so
        // the emblem's narrow strips keep a line of gold.
        const inner = c.pts.every(([i, j]) => i > 0 && j > 0 && i < lt.w * SUB && j < ROWS * SUB) && lt.ch === "A" && !!emblem;
        const b = BEVEL * size * (inner ? 0.75 : 1);
        const n = c.pts.length;
        // Each corner's bevel point: in from the corner along both edges' normals.
        const inset = c.pts.map((p, k) => {
          const [ax, ay] = c.normals[(k + n - 1) % n], [bx, by] = c.normals[k];
          const [u, v] = atq(p);
          return [u - b * (ax + bx), v - b * (ay + by)] as Pt;
        });
        c.pts.forEach((p, k) => {
          const k2 = (k + 1) % n;
          bevels[dirOf(c.normals[k])] += poly([P(atq(p)), P(atq(c.pts[k2])), P(inset[k2]), P(inset[k])]);
        });
      }
    }
  }

  // Bounds: the front's foot is the widest, the back's floor the lowest.
  const t = OUTLINE * size;
  const left = P([0, size])[0], right = P([cols * cw, size])[0];
  const pad = t + 1;
  const width = right - left + pad * 2, height = size * (1 + DEPTH) + pad * 2;
  const g = idPrefix;
  const svg = `<defs><linearGradient id="${g}-face" x1="0" y1="0" x2="0" y2="${f(size)}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${L["face-top"]}"/><stop offset="0.49" stop-color="${L["face-mid"]}"/>` +
    `<stop offset="0.495" stop-color="${L["face-low"]}"/><stop offset="1" stop-color="${L["face-foot"]}"/></linearGradient></defs>` +
    `<g transform="translate(${f(pad - left)} ${f(pad)})">` +
    // The outline: the whole solid, stroked wide with square corners.
    `<path d="${silhouette}${sweep}" fill="${L.outline}" stroke="${L.outline}" stroke-width="${f(t * 2)}" stroke-linejoin="miter" stroke-miterlimit="1.5"/>` +
    `<path d="${extrusion}" fill="${L.extrusion}" stroke="${L.extrusion}" stroke-width="${f(size * 0.003)}"/>` +
    `<path d="${faces}" fill="url(#${g}-face)" fill-rule="evenodd"/>` +
    (plain ? "" : Object.entries(bevels).map(([k, d]) => `<path d="${d}" fill="${L[`bevel-${k}` as keyof typeof L]}"/>`).join("")) +
    (snowBody ? `<path d="${snowBody}" fill="${SNOW.body}"/><path d="${snowShade}" fill="${SNOW.shade}"/><path d="${snowTop}" fill="${SNOW.top}"/>` : "") +
    `</g>`;
  return { svg, width, height };
}

// `node scripts/airfields-logo.ts out.svg [text]`: a quick look at the lettering.
if (process.argv[1] && process.argv[1].endsWith("airfields-logo.ts")) {
  const fs = await import("node:fs");
  const text = process.argv[3] ?? "AIRFIELDS";
  const emb = process.argv[4] === "winter" ? snowflake : undefined;
  const l = lettering(text, 263, { emblem: emb, snow: process.argv[4] === "winter" });
  fs.writeFileSync(process.argv[2] ?? "lettering.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="${f(l.width)}" height="${f(l.height)}" viewBox="0 0 ${f(l.width)} ${f(l.height)}">${l.svg}</svg>`);
}
