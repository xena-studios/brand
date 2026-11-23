import { test } from "node:test";
import assert from "node:assert/strict";
import { catalog } from "../scripts/catalog.ts";
import { contrast } from "../scripts/color.ts";

test("catalog: ids, names and accents are each used once", () => {
  const { plugins } = catalog();
  for (const key of ["id", "name", "accent"] as const) {
    assert.equal(new Set(plugins.map((p) => p[key])).size, plugins.length, `duplicate ${key}`);
  }
});

test("catalog: the name is the prefix plus the rest, and the id is the name in lowercase", () => {
  for (const p of catalog().plugins) {
    assert.ok(p.name.startsWith(p.prefix), p.id);
    assert.equal(p.name.toLowerCase(), p.id);
  }
});

test("catalog: every accentText reads on the family's background", () => {
  const { plugins, colors } = catalog();
  for (const p of plugins) assert.ok(contrast(p.accentText, colors.bg) >= 4.5, p.id);
});
