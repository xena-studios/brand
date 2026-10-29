// opentype.js 2.0 ships no types (and @types/opentype.js is for 1.x), so these
// cover only what the scripts use.
declare module "opentype.js" {
  export type PathCommand =
    | { type: "M" | "L"; x: number; y: number }
    | { type: "Q"; x1: number; y1: number; x: number; y: number }
    | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { type: "Z" };

  export interface BoundingBox { x1: number; y1: number; x2: number; y2: number }

  export class Path {
    commands: PathCommand[];
    getBoundingBox(): BoundingBox;
  }

  export interface Glyph {
    advanceWidth: number;
    getPath(x: number, y: number, fontSize: number): Path;
  }

  export interface Font {
    unitsPerEm: number;
    charToGlyph(char: string): Glyph;
    getKerningValue(left: Glyph, right: Glyph): number;
  }

  export function parse(buffer: ArrayBuffer): Font;

  const opentype: { parse: typeof parse; Path: typeof Path };
  export default opentype;
}
