import { test } from "node:test";
import assert from "node:assert/strict";
import { colorToken, dtcg } from "../scripts/dtcg.ts";

test("colorToken: sRGB components and hex", () => {
  assert.deepEqual(colorToken("#5cb4ff").$value, { colorSpace: "srgb", components: [0.3608, 0.7059, 1], hex: "#5CB4FF" });
});

test("dtcg: every colour in tokens/<brand>.json, as a color token", () => {
  const x = dtcg("colors").xena as Record<string, { $type?: string }>;
  assert.equal(x.accent.$type, "color");
  const r = dtcg("raptor").raptor as Record<string, { $extensions?: Record<string, string> }>;
  assert.match(r["signal-red"].$extensions!["co.xenastudios.oklch"], /^oklch\(/);
});
