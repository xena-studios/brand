import { test } from "node:test";
import assert from "node:assert/strict";
import { scopeIds } from "../scripts/output.ts";

test("scopeIds: names ids after the file, and follows every reference", () => {
  const svg = `<defs><linearGradient id="glow12"/><clipPath id="clip3"/></defs><rect fill="url(#glow12)" clip-path="url(#clip3)"/><use href="#glow12"/>`;
  const out = scopeIds("github/brand.svg", svg);
  assert.match(out, / id="github-brand-glow"/);
  assert.match(out, / id="github-brand-clip"/);
  assert.match(out, /url\(#github-brand-glow\)/);
  assert.match(out, /href="#github-brand-glow"/);
  assert.doesNotMatch(out, /glow12|clip3/);
});

test("scopeIds: the same graphic gets the same ids whatever the build's counter was", () => {
  const a = scopeIds("x/y.svg", `<g id="glow1"/><rect fill="url(#glow1)"/>`);
  const b = scopeIds("x/y.svg", `<g id="glow87"/><rect fill="url(#glow87)"/>`);
  assert.equal(a, b);
});

test("scopeIds: repeats of one kind are numbered", () => {
  const out = scopeIds("a.svg", `<g id="glow1"/><g id="glow2"/>`);
  assert.match(out, /id="a-glow"/);
  assert.match(out, /id="a-glow-2"/);
});
