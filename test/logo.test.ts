import { test } from "node:test";
import assert from "node:assert/strict";
import { committedLogo, endorsement } from "../scripts/logo.ts";

test("committedLogo: scales the committed outline to the cap height", () => {
  const big = committedLogo("full", { cap: 100, fill: "#FFF" }), small = committedLogo("full", { cap: 14, fill: "#FFF" });
  assert.ok(big.width > 0);
  assert.ok(Math.abs(small.width - big.width * 0.14) < 1e-6);
  assert.match(small.svg, /scale\(0\.14\)/);
});

test("endorsement: XENA STUDIOS with its ink at (x, y)", () => {
  assert.match(endorsement(120, 98, 14, "#EDF1F7"), /translate\(113 91\) scale\(0\.14\)/);
});
