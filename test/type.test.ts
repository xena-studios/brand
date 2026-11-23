import { test } from "node:test";
import assert from "node:assert/strict";
import { fonts } from "../scripts/fonts.ts";
import { text } from "../scripts/type.ts";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≈ ${b}`);

test("text: anchors by ink", () => {
  const o = { size: 40, fill: "#FFF" };
  close(text(fonts.mono, "Brand", { ...o, x: 100, anchor: "start" }).left, 100);
  close(text(fonts.mono, "Brand", { ...o, x: 100, anchor: "end" }).right, 100);
  const m = text(fonts.mono, "Brand", { ...o, x: 100, anchor: "middle" });
  close((m.left + m.right) / 2, 100);
});

test("text: pen anchoring keeps the sidebearing", () => {
  const t = text(fonts.mono, "Brand", { size: 40, fill: "#FFF", x: 100, anchor: "pen" });
  assert.ok(t.left > 100);
});

test("text: never emits NaN, and an empty string draws nothing", () => {
  assert.doesNotMatch(text(fonts.groteskBold, "Every command you need.", { size: 54.3, x: 12.7, y: 33.1, fill: "#FFF" }).svg, /NaN/);
  assert.equal(text(fonts.mono, "", { size: 10, fill: "#FFF" }).svg, "");
});
