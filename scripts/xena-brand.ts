// Xena Studios: the studio's own identity. Type only (Ethnocentric), Ion Blue on deep
// space, and the planet horizon every Xena graphic shares. Drawn by scripts/art/xena.ts.
import type { LogoKey } from "./logo.ts";

// Ion Blue on deep space.
export const C = {
  void: "#06080D", space: "#0A0E16", surface: "#121824", line: "#222B3B",
  muted: "#8A93A6", text: "#EDF1F7", accent: "#5CB4FF",
};

export const ORG_TAGLINE = "Game servers, and the tools to run them.";

// The three lockups, set in Ethnocentric by pnpm build:logos and read back from logo/
// by everything else (scripts/logo.ts).
export interface Lockup { str: string; tracking: number }

export const logos: Record<LogoKey, Lockup & { file: string }> = {
  full: { str: "XENA STUDIOS", tracking: 0.04, file: "xena-studios" },
  short: { str: "XENA", tracking: 0.06, file: "xena" },
  x: { str: "X", tracking: 0, file: "x" },
};
