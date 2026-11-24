// The brands the site has a page for: their guide, colours and files.
import { read, tracked } from "./repo.ts";

export interface Brand {
  id: string;
  name: string;
  /** The tile shown beside the name. */
  icon: string;
  /** The brand's colour tokens (tokens/<file>). */
  tokens: string;
  /** The one colour that says which brand it is. */
  accent: string;
  /** The folders holding its files. */
  dirs: string[];
  site?: string;
}

export const BRANDS: Brand[] = [
  { id: "xena", name: "Xena Studios", icon: "avatar/avatar.png", tokens: "colors.json", accent: "accent", dirs: ["logo", "avatar", "social", "scene", "github", "workspace", "people"], site: "https://xenastudios.co" },
  { id: "raptor", name: "Raptor", icon: "raptor/icon.png", tokens: "raptor.json", accent: "signal-red", dirs: ["raptor"], site: "https://raptorpanel.net" },
  { id: "neoskript", name: "NeoSkript", icon: "neoskript/icon.png", tokens: "neoskript.json", accent: "magenta", dirs: ["neoskript"], site: "https://neoskript.dev" },
  { id: "plugins", name: "Plugins", icon: "plugins/xutilities/icon.png", tokens: "plugins.json", accent: "xutilities", dirs: ["plugins"], site: "https://plugins.xenastudios.co" },
  { id: "mostwanted", name: "MostWanted", icon: "mostwanted/icon.png", tokens: "mostwanted.json", accent: "orange", dirs: ["mostwanted"], site: "https://mostwantedmc.com" },
  { id: "airfields", name: "Airfields", icon: "airfields/icon.png", tokens: "airfields.json", accent: "gold", dirs: ["airfields"], site: "https://airfieldsmc.com" },
];

export interface Swatch { name: string; hex: string }

/** A brand's colours, in the order its token file lists them. */
export function colours(b: Brand): Swatch[] {
  const json = JSON.parse(read(`tokens/${b.tokens}`)) as Record<string, string | { hex: string }>;
  return Object.entries(json).map(([name, v]) => ({ name, hex: (typeof v === "string" ? v : v.hex).toUpperCase() }));
}

export const accent = (b: Brand) => colours(b).find((c) => c.name === b.accent)!.hex;

export interface Asset {
  /** The file to show: the PNG, or the SVG where there's no PNG. */
  preview: string;
  name: string;
  png?: string;
  svg?: string;
}

/** A brand's pictures, grouped by folder, each with its PNG and SVG where both exist. */
export function assets(b: Brand): [string, Asset[]][] {
  const groups = new Map<string, Map<string, Asset>>();
  for (const f of tracked()) {
    const m = f.match(/^(.+)\/([^/]+)\.(png|svg)$/);
    if (!m || !b.dirs.includes(f.split("/")[0])) continue;
    const [, dir, name, ext] = m;
    const group = groups.get(dir) ?? new Map<string, Asset>();
    groups.set(dir, group);
    const a = group.get(name) ?? { preview: f, name };
    a[ext as "png" | "svg"] = f;
    a.preview = a.png ?? f;
    group.set(name, a);
  }
  const order = (dir: string) => b.dirs.indexOf(dir.split("/")[0]);
  return [...groups]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
    .map(([dir, g]) => [dir, [...g.values()]]);
}
