// MostWanted: Xena's Jailbreak-style cops vs. prisoners Minecraft server. A
// product with its own identity, like Raptor and NeoSkript; Xena supplies only
// the horizon and the XENA STUDIOS endorsement.
//
// The marks aren't drawn here: the MOSTWANTED wordmark and the MW monogram are
// pixel artwork, kept verbatim in mostwanted/official/ and placed as images.

// Desert Orange on dusk. The accent stays clear of Ion Blue, Signal Red, Neo
// Magenta and the plugin family's amber, green and violet. Neutrals are tinted
// toward orange (hue 30).
// An official image and its pixel size.
export interface Art { file: string; w: number; h: number }

export const mostwantedColors = {
  orange: "#FF9933",           // the one accent: headline, horizon, buttons
  "orange-daylight": "#B34700", // orange text on light backgrounds (5.1:1 on sand-light)
  dusk: "#150D09",             // page / banner background
  "dusk-raised": "#21150F",    // cards, icon tile, planet body
  "dusk-rule": "#3B2A20",      // borders
  text: "#FBF4EC",             // text on dark
  muted: "#B8A797",            // kickers, secondary text
  ink: "#1C110B",              // text on light, text on orange
  "sand-light": "#FBF6F0",     // light backgrounds
  // The wordmark's bands, top to bottom. For illustration, not text.
  sand: "#EEBD3B",
  amber: "#E29020",
  burnt: "#C46002",
  clay: "#893500",
};

export const mostwanted: {
  kicker: string;
  tagline: string;
  summary: string;
  wordmark: Art;
  monogram: Art;
  desert: Art;
} = {
  kicker: "// MINECRAFT SERVER",
  // Says what the server is, for people who've never heard of it.
  tagline: "Cops vs. prisoners on Java & Bedrock",
  summary: "A Jailbreak-style cops vs. prisoners Minecraft server, for Java and Bedrock. Break out, rob the town, and stay ahead of the guards.",
  // Pixel sizes of the official artwork, so layouts keep its aspect ratio.
  wordmark: { file: "mostwanted/official/wordmark.png", w: 2000, h: 277 },
  monogram: { file: "mostwanted/official/monogram.png", w: 2000, h: 1101 },
  desert: { file: "mostwanted/official/desert.png", w: 1280, h: 720 },
};
