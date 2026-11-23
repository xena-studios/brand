// Type as outlines: every letter the build draws becomes a vector path, so no font file
// ever ships (Ethnocentric's licence forbids it, and outlines render the same everywhere).
import opentype, { type Font, type PathCommand } from "opentype.js";

export const f = (n: number) => +n.toFixed(2);

// opentype.js 2.0's toPathData emits NaN for some coordinates; serialise ourselves.
export const pathData = (cmds: PathCommand[]) => cmds.map((c) =>
  c.type === "Z" ? "Z" :
  c.type === "Q" ? `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}` :
  c.type === "C" ? `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}` :
  `${c.type}${f(c.x)} ${f(c.y)}`).join("");

// Lays out `str` glyph by glyph (kerning + tracking in em) and aligns by ink
// bounds, so optical edges line up regardless of sidebearings. "pen" places the
// pen at x instead, as type in a text box sits.
export interface TextOptions {
  x?: number;
  y?: number;
  size: number;
  tracking?: number;
  anchor?: "start" | "middle" | "end" | "pen";
  fill: string;
}

export function text(font: Font, str: string, { x = 0, y = 0, size, tracking = 0, anchor = "start", fill }: TextOptions) {
  const build = (ox: number) => {
    // Direct cmap lookup: opentype.js chokes on some GSUB lookups, and this
    // is plain ASCII that needs no shaping.
    const glyphs = [...str].map((c) => font.charToGlyph(c));
    const scale = size / font.unitsPerEm;
    const p = new opentype.Path();
    let cx = ox;
    glyphs.forEach((g, i) => {
      // Draw at the origin and translate ourselves: opentype.js emits NaN
      // control points for some TrueType glyphs at fractional offsets.
      for (const c of g.getPath(0, 0, size).commands) {
        const t: Record<string, string | number> = { ...c };
        for (const k of ["x", "x1", "x2"]) if (typeof t[k] === "number") t[k] += cx;
        for (const k of ["y", "y1", "y2"]) if (typeof t[k] === "number") t[k] += y;
        p.commands.push(t as PathCommand);
      }
      cx += g.advanceWidth * scale;
      if (i < glyphs.length - 1) cx += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size;
    });
    return p;
  };
  const bb = build(0).getBoundingBox();
  const shift = anchor === "pen" ? x : anchor === "start" ? x - bb.x1 : anchor === "end" ? x - bb.x2 : x - (bb.x1 + bb.x2) / 2;
  const d = pathData(build(shift).commands);
  return {
    svg: d ? `<path d="${d}" fill="${fill}"/>` : "",
    width: bb.x2 - bb.x1, top: bb.y1, bottom: bb.y2,
    left: bb.x1 + shift, right: bb.x2 + shift,
  };
}

export const capHeight = (font: Font, size: number) => {
  const bb = font.charToGlyph("X").getPath(0, 0, size).getBoundingBox();
  return -bb.y1;
};
