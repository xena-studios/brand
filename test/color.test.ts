import { test } from "node:test";
import assert from "node:assert/strict";
import { contrast, distance, mix, readable, oklab } from "../scripts/color.ts";

test("contrast: WCAG's own extremes and symmetry", () => {
  assert.equal(+contrast("#000000", "#FFFFFF").toFixed(2), 21);
  assert.equal(contrast("#777777", "#777777"), 1);
  assert.equal(contrast("#5CB4FF", "#06080D"), contrast("#06080D", "#5CB4FF"));
});

test("distance: zero for one colour, large for opposites", () => {
  assert.equal(distance("#5CB4FF", "#5CB4FF"), 0);
  assert.ok(distance("#000000", "#FFFFFF") > 0.99);
});

test("oklab: white is L=1 with no hue", () => {
  const [L, a, b] = oklab("#FFFFFF");
  assert.ok(Math.abs(L - 1) < 1e-3 && Math.abs(a) < 1e-3 && Math.abs(b) < 1e-3);
});

test("mix: the ends and the middle", () => {
  assert.equal(mix("#000000", "#FFFFFF", 0), "#000000");
  assert.equal(mix("#000000", "#FFFFFF", 1), "#FFFFFF");
  assert.equal(mix("#000000", "#FFFFFF", 0.5), "#808080");
});

test("readable: keeps a readable accent, lifts a dark one to 4.5:1", () => {
  assert.equal(readable("#5CB4FF", "#121116"), "#5CB4FF");
  const lifted = readable("#3A0010", "#121116");
  assert.notEqual(lifted, "#3A0010");
  assert.ok(contrast(lifted, "#121116") >= 4.5);
});
