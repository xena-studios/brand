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
  // A pin over the ring it lands in: where a teleport puts you.
  pin: [
    "................",
    ".....######.....",
    "...##########...",
    "..####....####..",
    "..###......###..",
    "..###......###..",
    "..####....####..",
    "..############..",
    "...##########...",
    "....########....",
    ".....######.....",
    "......####......",
    ".......##.......",
    "...###....###...",
    ".##..........##.",
    "...##########...",
  ],
  // A ballot over the box it goes in, ticked: a vote.
  ballot: [
    "................",
    "....########....",
    "....########....",
    "....######.#....",
    "....#####.##....",
    "....#.##.###....",
    "....##..####....",
    "....########....",
    "................",
    ".##############.",
    ".##..........##.",
    ".##############.",
    ".##############.",
    ".##############.",
    ".##############.",
    "................",
  ],
  // A gavel coming down on its block: a ruling.
  gavel: [
    "................",
    "....##..........",
    "...####.........",
    "..######........",
    ".########.......",
    "..########......",
    "...########.....",
    "....######.##...",
    ".....####.####..",
    "......##...####.",
    "............###.",
    ".............#..",
    "................",
    "................",
    "..##########....",
    ".############...",
  ],
  // A coin on its edge, with its stamp: money.
  coin: [
    "................",
    ".....######.....",
    "...##########...",
    "..####....####..",
    ".####......####.",
    ".###...##...###.",
    ".###..###...###.",
    ".###...##...###.",
    ".###...##...###.",
    ".###...##...###.",
    ".###..####..###.",
    ".####......####.",
    "..####....####..",
    "...##########...",
    ".....######.....",
    "................",
  ],
  // A podium: first, second and third, as on every leaderboard.
  podium: [
    "................",
    "................",
    "......####......",
    "......####......",
    "......####......",
    "......####......",
    ".####.####......",
    ".####.####......",
    ".####.####.####.",
    ".####.####.####.",
    ".####.####.####.",
    ".####.####.####.",
    ".####.####.####.",
    ".####.####.####.",
    "................",
    "................",
  ],
  // A safe with its dial: where backups are kept.
  safe: [
    "................",
    ".##############.",
    ".##############.",
    ".##..........##.",
    ".##..######..##.",
    ".##..#....#..##.",
    ".##..#.##.#..##.",
    ".##..#.##.#..##.",
    ".##..#....#..##.",
    ".##..######..##.",
    ".##..........##.",
    ".##############.",
    ".##############.",
    "..##........##..",
    "..##........##..",
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

// The catalog's groups, in the order they're shown.
export const categories = ["Players", "Moderation", "Economy", "Server"] as const;
export type Category = (typeof categories)[number];

export interface Plugin {
  id: string;
  prefix: string;
  name: string;
  accent: string;
  glyph: string;
  kicker: string;
  headline: [string, string];
  summary: string;
  // Where the plugin sits in the catalog: the README, the docs' home page and its sidebar.
  category: Category;
  // One sentence after the headline, for lists: the docs' home page and the README.
  blurb: string;
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
    category: "Players",
    blurb: "Gamemodes, fly, heal, `/back`, workstations and your own link commands.",
  },
  {
    id: "zchat", prefix: "z", name: "Chat", accent: "#5EE08A", glyph: "bubble",
    kicker: "// CHAT PLUGIN",
    headline: ["Format your chat. ", "Keep it clean."],
    summary: "Chat formatting per rank, a chat filter that's hard to dodge, mentions, private messages, cooldowns and anti-spam, in one light chat plugin. Each message is drawn once, however many players see it. For Paper and Folia.",
    category: "Players",
    blurb: "Chat formats per rank, a filter that's hard to dodge, mentions and private messages.",
  },
  {
    id: "xlimbo", prefix: "x", name: "Limbo", accent: "#B48CFF", glyph: "block",
    kicker: "// FALLBACK SERVER",
    headline: ["Never drop ", "a player again."],
    summary: "A limbo and fallback server for Velocity and BungeeCord. When your main server goes down, players wait in a safe void world instead of being kicked, then go back with /join, or on their own once it's up. For Paper.",
    category: "Server",
    blurb: "A fallback server that holds players when your main server goes down, and sends them back when it's up.",
  },
  {
    id: "xrewind", prefix: "x", name: "Rewind", accent: "#3DD6C6", glyph: "rewind",
    kicker: "// BLOCK LOGGER",
    headline: ["Every change, logged. ", "Any of it, undone."],
    summary: "Block logger and rollback, and a free CoreProtect alternative: see who placed, broke or took what, then preview a rollback and undo it. Uses CoreProtect's commands and imports its history. For Paper and Folia.",
    category: "Moderation",
    blurb: "A block logger with rollback, every feature free, with CoreProtect's commands and your CoreProtect history.",
  },
  {
    // Grass-block lime, OKLCH hue 126: between Airfields' gold (95 to 99) and zChat's green (152).
    id: "xplots", prefix: "x", name: "Plots", accent: "#A9D750", glyph: "sign",
    kicker: "// RENTABLE PLOTS",
    headline: ["Rentable plots, ", "set up in a minute."],
    summary: "Rentable plots for box and PvP servers: select an area and it's split into a grid of plots, each with its sign. Players rent with Vault or an item, add members and pay ahead; expired plots reset themselves. For Paper.",
    category: "Economy",
    blurb: "Select an area and every plot and sign is made for you; players rent, add members and pay ahead.",
  },
  {
    // Fuchsia, OKLCH hue 322, dark and vivid (L 0.64): a portal colour, deeper than xLimbo's
    // lilac and bluer than NeoSkript's magenta.
    id: "xteleport", prefix: "x", name: "Teleport", accent: "#CE41E3", glyph: "pin",
    kicker: "// TELEPORT PLUGIN",
    headline: ["Every teleport ", "your server needs."],
    summary: "Homes, TPA, warps, spawn and random teleport in one light plugin, with warmups, cooldowns and costs through Vault. Imports homes and warps from EssentialsX. For Paper and Folia.",
    category: "Players",
    blurb: "Homes, TPA, warps, spawn and random teleport in one plugin, with warmups, cooldowns and costs.",
  },
  {
    // Cobalt, OKLCH hue 266, dark (L 0.62): deeper and more violet than Ion Blue (247, L 0.75).
    id: "xvote", prefix: "x", name: "Vote", accent: "#4D7BFD", glyph: "ballot",
    kicker: "// VOTE REWARDS",
    headline: ["Votes in. ", "Rewards out."],
    summary: "Vote rewards with a built-in Votifier for Paper and Folia: keeps NuVotifier's keys and tokens, rewards per site, streaks and every Nth vote, a vote party, leaderboards, and offline votes paid on join. Imports VotingPlugin and SuperbVote totals.",
    category: "Economy",
    blurb: "A built-in Votifier that keeps NuVotifier's keys, rewards per site, streaks and a vote party, paid once even across a network.",
  },
  {
    // Crimson, OKLCH hue 20, dark and vivid (L 0.56): a ban's red, deeper and redder than
    // Raptor's coral Signal Red (25, L 0.66).
    id: "xbans", prefix: "x", name: "Bans", accent: "#D70E3A", glyph: "gavel",
    kicker: "// PUNISHMENTS",
    headline: ["Bans, mutes and warnings. ", "Nothing slips through."],
    summary: "Bans, mutes, warnings and kicks for Paper and Folia, free and open source. Checked from memory at every join and chat message, with templates, staff limits, alts and IP bans. Uses LiteBans' commands and imports its history.",
    category: "Moderation",
    blurb: "Checked from memory at every join and chat message, with templates, staff limits, alts and IP bans. Uses LiteBans' commands and imports its history.",
  },
  {
    // Emerald, OKLCH hue 163, dark (L 0.66): money green, well below zChat's bright green
    // and greener than xRewind's teal. Gold would be the obvious money colour, but it's Airfields'.
    id: "xmoney", prefix: "x", name: "Money", accent: "#10AC79", glyph: "coin",
    kicker: "// ECONOMY",
    headline: ["The economy and Vault, ", "in one plugin."],
    summary: "An economy that is its own Vault: balances, /pay, /baltop and a ledger of every change, with the Vault and VaultUnlocked APIs built in, so shop and jobs plugins work without Vault.jar. Imports EssentialsX, CMI or any Vault economy. For Paper and Folia.",
    category: "Economy",
    blurb: "Balances, /pay and /baltop, a ledger of every change, and Vault's API built in, so shops work without Vault.jar.",
  },
  {
    // Vivid green, OKLCH hue 140 (L 0.72, chroma 0.23): numbers going up. Far more saturated
    // than zChat's mint-green and much lighter than xMoney's emerald.
    id: "xstats", prefix: "x", name: "Stats", accent: "#3EC407", glyph: "podium",
    kicker: "// PLAYER STATS",
    headline: ["Every player's stats, ", "on your own website."],
    summary: "Player stats, leaderboards and a stats website your server hosts itself: playtime that leaves out AFK time, kills, blocks and any placeholder, with daily, weekly and monthly leaderboards, PlaceholderAPI and in-world boards. For Paper and Folia.",
    category: "Players",
    blurb: "Playtime that leaves out AFK time, leaderboards by day, week and month, placeholders, and a stats site your server hosts itself.",
  },
  {
    // Ice, OKLCH hue 212, pale (L 0.90, chroma 0.08): cold storage, far lighter than xRewind's
    // teal and Ion Blue.
    id: "xbackup", prefix: "x", name: "Backup", accent: "#9EEDFD", glyph: "safe",
    kicker: "// BACKUP PLUGIN",
    headline: ["Backups that cost nothing. ", "Restores you can trust."],
    summary: "Incremental backups for Paper and Folia: only what changed is stored, chunk by chunk, with a save pause of milliseconds. Copies to S3, WebDAV, SFTP, FTP, Google Drive, OneDrive and Dropbox, and restores from the command line or on the next start.",
    category: "Server",
    blurb: "Only what changed is stored, chunk by chunk, and copied to S3, SFTP, WebDAV or a cloud drive.",
  },
];

// The released plugins: the family's cards, horizon and lineup show these.
export const family = plugins.filter((p) => p.released !== false);
