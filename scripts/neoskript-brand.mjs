// NeoSkript: a fast, modern drop-in replacement for Skript. A flagship product
// with its own identity, like Raptor; Xena supplies only the horizon and the
// XENA STUDIOS endorsement.

// Neo Magenta on night. The accent stays clear of Ion Blue, Signal Red and the
// plugin family's amber, green and violet.
export const neoskriptColors = {
  magenta: "#FF4D9D",          // the one accent: mark, headline, horizon
  "magenta-daylight": "#D61F78", // magenta on light backgrounds
  night: "#110B13",            // page / banner background
  "night-raised": "#1B1320",   // cards, planet body
  "night-rule": "#30243A",     // borders
  text: "#F7F1F6",             // wordmark and text on dark
  muted: "#A898A9",            // kickers, secondary text
  ink: "#1A1219",              // wordmark and text on light
  string: "#FFC2DD",           // string literals in code samples
};

// The mark, in a 64 × 64 box: an event line ending in a colon, the indented
// line under it, and the cursor. A Skript script, being written.
export const markBox = { x: 6, y: 9.4, w: 52, h: 44.6 };
export const mark = (fill, cursor = fill) =>
  `<rect x="6" y="10" width="34" height="10" rx="5" fill="${fill}"/>` +
  `<circle cx="46" cy="12" r="2.6" fill="${fill}"/><circle cx="46" cy="18" r="2.6" fill="${fill}"/>` +
  `<rect x="20" y="27" width="38" height="10" rx="5" fill="${fill}"/>` +
  `<rect x="20" y="44" width="10" height="10" rx="1.5" fill="${cursor}"/>`;

export const neoskript = {
  kicker: "// SKRIPT, REBUILT",
  headline: ["Keep your scripts. ", "Lose the lag."],
  summary: "A fast, modern drop-in replacement for Skript. Your .sk scripts run unchanged, only faster. For Paper and Folia.",
  // The banner's code card: a script any Skript user recognises, runnable as-is.
  sample: {
    file: "join.sk",
    lines: [
      [["on ", "magenta"], ["join", "text"], [":", "muted"]],
      [["    send ", "magenta"], ['"Welcome, %player%!"', "string"], [" to ", "magenta"], ["player", "text"]],
    ],
  },
};
