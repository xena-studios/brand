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
const glyphs: Record<string, string[]> = {
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
  // Rewind: two triangles pointing back, as on every player's rewind button.
  rewind: [
    "................",
    "................",
    "......#......#..",
    ".....##.....##..",
    "....###....###..",
    "...####...####..",
    "..#####..#####..",
    ".######.######..",
    "..#####..#####..",
    "...####...####..",
    "....###....###..",
    ".....##.....##..",
    "......#......#..",
    "................",
    "................",
    "................",
  ],
  // A plot's sign on its post: the sign players click to rent one.
  sign: [
    "................",
    "................",
    ".##############.",
    ".##############.",
    ".##..........##.",
    ".##############.",
    ".##........####.",
    ".##############.",
    ".##############.",
    ".......##.......",
    ".......##.......",
    ".......##.......",
    ".......##.......",
    ".......##.......",
    ".......##.......",
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
const FACES: Record<string, Cell> = { t: "light", b: "base", d: "dark", f: "floor" };

export type Cell = "light" | "base" | "dark" | "floor";

export interface Plugin {
  id: string;
  prefix: string;
  name: string;
  accent: string;
  glyph: string;
  kicker: string;
  headline: [string, string];
  summary: string;
  // false while it's being built: it gets its own files, but stays off the family's
  // cards, horizon and lineup until its first release.
  released?: boolean;
}

// Grid of null | "light" | "base" | "dark" | "floor".
export function glyphCells(name: string): (Cell | null)[][] {
  const rows = glyphs[name];
  if (rows.some((r) => /[tbdf]/.test(r))) return rows.map((r) => [...r].map((c) => FACES[c] ?? null));
  const on = rows.map((r) => [...r].map((c) => c === "#"));
  // Empty cells reachable from the border are outside; enclosed ones are holes.
  const out = on.map((r) => r.map(() => false)), q: [number, number][] = [];
  for (let i = 0; i < N; i++) q.push([i, 0], [i, N - 1], [0, i], [N - 1, i]);
  while (q.length) {
    const [x, y] = q.pop()!;
    if (x < 0 || y < 0 || x >= N || y >= N || out[y][x] || on[y][x]) continue;
    out[y][x] = true;
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && !out[y][x];
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
// Modrinth titles are "<name>: <what it is>" (docs/plugins.md), because Modrinth's
// search ranks a word in the title above everything else.
export const plugins: Plugin[] = [
  {
    id: "xutilities", prefix: "x", name: "Utilities", accent: "#F5B83D", glyph: "wrench",
    kicker: "// UTILITY PLUGIN",
    headline: ["Every command you need. ", "None you don't."],
    summary: "Lightweight essentials for Paper and Folia: gamemode, fly, speed, heal, feed, /back, /top and repair, with anvils, crafting tables and other workstations anywhere. Add your own link commands like /discord, and switch off any command.",
  },
  {
    id: "zchat", prefix: "z", name: "Chat", accent: "#5EE08A", glyph: "bubble",
    kicker: "// CHAT PLUGIN",
    headline: ["Format your chat. ", "Keep it clean."],
    summary: "Chat formatting per rank, a chat filter that's hard to dodge, mentions, private messages, cooldowns and anti-spam, in one light chat plugin. Each message is drawn once, however many players see it. For Paper and Folia.",
  },
  {
    id: "xlimbo", prefix: "x", name: "Limbo", accent: "#B48CFF", glyph: "block",
    kicker: "// FALLBACK SERVER",
    headline: ["Never drop ", "a player again."],
    summary: "A limbo and fallback server for Velocity and BungeeCord. When your main server goes down, players wait in a safe void world instead of being kicked, then go back with /join, or on their own once it's up. For Paper.",
  },
  {
    id: "xrewind", prefix: "x", name: "Rewind", accent: "#3DD6C6", glyph: "rewind",
    kicker: "// BLOCK LOGGER",
    headline: ["Every change, logged. ", "Any of it, undone."],
    summary: "Block logger and rollback, and a free CoreProtect alternative: see who placed, broke or took what, then preview a rollback and undo it. Uses CoreProtect's commands and imports its history. For Paper and Folia.",
  },
  {
    // Grass-block lime, OKLCH hue 126: between Airfields' gold (95 to 99) and zChat's green (152).
    id: "xplots", prefix: "x", name: "Plots", accent: "#A9D750", glyph: "sign",
    kicker: "// RENTABLE PLOTS",
    headline: ["Rentable plots, ", "set up in a minute."],
    summary: "Rentable plots for box and PvP servers: select an area and it's split into a grid of plots, each with its sign. Players rent with Vault or an item, add members and pay ahead; expired plots reset themselves. For Paper.",
    released: false,
  },
];

// The released plugins: the family's cards, horizon and lineup show these.
export const family = plugins.filter((p) => p.released !== false);
