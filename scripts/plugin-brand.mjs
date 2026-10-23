// The Xena plugin family: small, single-purpose Minecraft plugins that share one
// system (a deepslate base, a 16×16 pixel glyph and one accent per plugin) under
// the XENA STUDIOS endorsement. Flagship products (Raptor, NeoSkript) get their
// own brands instead. A new plugin needs a glyph and an unused accent.

// Shared neutrals. Accents must stay clear of Xena's Ion Blue and Raptor's Signal Red.
export const pluginColors = {
  bg: "#121116", raised: "#1B1A21", rule: "#2A2832", text: "#F2F0F5", muted: "#9C99A8",
};

// 16×16 glyphs, "#" = filled. Shading is derived: light on top/left edges, dark on
// bottom/right, enclosed holes dark. A grid of letters sets faces by hand instead
// (t = light, b = base, d = dark, f = floor).
const glyphs = {
  wrench: [
    "................",
    "........###.....",
    ".......####.##..",
    ".......###..###.",
    ".......###..###.",
    ".......########.",
    "........######..",
    ".......####.....",
    "......###.......",
    ".....###........",
    "....###.........",
    "...###..........",
    "..###...........",
    ".###............",
    ".##.............",
    "................",
  ],
  bubble: [
    "................",
    "................",
    "..############..",
    ".##############.",
    ".##############.",
    ".##############.",
    ".##..##..##..##.",
    ".##..##..##..##.",
    ".##############.",
    ".##############.",
    "..############..",
    "..###...........",
    "..##............",
    "..#.............",
    "................",
    "................",
  ],
  // A block floating over a glass floor: what a player sees in limbo.
  block: [
    "................",
    "......tttt......",
    "....tttttttt....",
    "..tttttttttttt..",
    "..bttttttttttd..",
    "..bbbttttttddd..",
    "..bbbbbttddddd..",
    "..bbbbbbdddddd..",
    "..bbbbbbdddddd..",
    "..bbbbbbdddddd..",
    "..bbbbbbdddddd..",
    "....bbbbdddd....",
    "......bbdd......",
    "................",
    "................",
    ".f.f.f.f.f.f.f..",
  ],
};

const N = 16;
const FACES = { t: "light", b: "base", d: "dark", f: "floor" };

// Grid of null | "light" | "base" | "dark" | "floor".
export function glyphCells(name) {
  const rows = glyphs[name];
  if (rows.some((r) => /[tbdf]/.test(r))) return rows.map((r) => [...r].map((c) => FACES[c] ?? null));
  const on = rows.map((r) => [...r].map((c) => c === "#"));
  // Empty cells reachable from the border are outside; enclosed ones are holes.
  const out = on.map((r) => r.map(() => false)), q = [];
  for (let i = 0; i < N; i++) q.push([i, 0], [i, N - 1], [0, i], [N - 1, i]);
  while (q.length) {
    const [x, y] = q.pop();
    if (x < 0 || y < 0 || x >= N || y >= N || out[y][x] || on[y][x]) continue;
    out[y][x] = true;
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const solid = (x, y) => x >= 0 && y >= 0 && x < N && y < N && !out[y][x];
  return on.map((row, y) => row.map((filled, x) => {
    if (out[y][x]) return null;
    if (!filled) return "dark";
    if (!solid(x, y - 1) || !solid(x - 1, y)) return "light";
    if (!solid(x, y + 1) || !solid(x + 1, y)) return "dark";
    return "base";
  }));
}

// Each plugin: name (prefix letter in the accent), glyph, the banner's // kicker and
// two-tone headline, and the Modrinth summary (the line under the name in search).
export const plugins = [
  {
    id: "xutilities", prefix: "x", name: "Utilities", accent: "#F5B83D", glyph: "wrench",
    kicker: "// UTILITY PLUGIN",
    headline: ["Every command you need. ", "None you don't."],
    summary: "Every command you need, none you don't: gamemodes, flight, heal, /back, workstation menus, and link commands like /discord that you write yourself. Every command can be switched off. For Paper and Folia.",
  },
  {
    id: "zchat", prefix: "z", name: "Chat", accent: "#5EE08A", glyph: "bubble",
    kicker: "// CHAT PLUGIN",
    headline: ["Format your chat. ", "Keep it clean."],
    summary: "A chat format per rank, a filter that's hard to dodge, cooldowns, mentions and private messages. Each message is drawn once, however many players see it. For Paper and Folia.",
  },
  {
    id: "xlimbo", prefix: "x", name: "Limbo", accent: "#B48CFF", glyph: "block",
    kicker: "// FALLBACK SERVER",
    headline: ["Never drop ", "a player again."],
    summary: "Your network's fallback server. When the main server goes down, players wait in a safe void world instead of being disconnected, then go back with /join, or on their own once it's up. For Paper.",
  },
];
