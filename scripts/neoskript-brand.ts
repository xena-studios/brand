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

// The mark: ".sk", the Skript file extension, set in Geist Bold. It says "runs
// your scripts" to every Skript user at a glance, which is the whole pitch.
export const markText = { str: ".sk", tracking: -0.02 };

export type NeoskriptColor = keyof typeof neoskriptColors;

export const neoskript: {
  kicker: string;
  headline: [string, string];
  summary: string;
  // Each line is a run of [text, colour] pairs.
  sample: { file: string; lines: [string, NeoskriptColor][][] };
} = {
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
