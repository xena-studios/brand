// Colour maths the plugin catalog and its checks share: OKLab distance (how different two
// accents look), WCAG contrast (whether an accent reads as text), and the docs' tints.

type Rgb = [number, number, number];

const channels = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const toHex = (rgb: Rgb) =>
  "#" + rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0").toUpperCase()).join("");

/** A colour in OKLab: lightness, then the green-red and blue-yellow axes. */
export function oklab(hex: string): Rgb {
  const [r, g, b] = channels(hex).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** The hex for an OKLab colour, or null outside sRGB. */
function fromOklab([L, a, b]: Rgb): string | null {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb: Rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  if (rgb.some((c) => c < -0.0005 || c > 1.0005)) return null;
  return toHex(rgb.map(gamma) as Rgb);
}

/** How different two colours look: OKLab distance. Under about 0.07, two accents read as one. */
export function distance(a: string, b: string): number {
  const [x, y] = [oklab(a), oklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast between two colours, from 1 to 21. Text needs 4.5. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [a] mixed toward [b] by [t], in sRGB, as the docs' tints always were. */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [channels(a), channels(b)];
  return toHex(x.map((c, i) => c + (y[i] - c) * t) as Rgb);
}

/**
 * The accent itself if it reads as text on [bg] (4.5:1), or the same hue made lighter
 * until it does: xBans' crimson is too dark for text, so its text is a lighter crimson.
 */
export function readable(accent: string, bg: string): string {
  if (contrast(accent, bg) >= 4.5) return accent;
  const [L, a, b] = oklab(accent);
  const chroma = Math.hypot(a, b);
  const hue = Math.atan2(b, a);
  for (let lift = L; lift <= 1; lift += 0.005) {
    // Lighter colours hold less chroma in sRGB: give some back until it fits.
    for (let c = chroma; c >= 0; c -= 0.005) {
      const hex = fromOklab([lift, c * Math.cos(hue), c * Math.sin(hue)]);
      if (hex) {
        if (contrast(hex, bg) >= 4.5) return hex;
        break;
      }
    }
  }
  return "#FFFFFF";
}
