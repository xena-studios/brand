import { test } from "node:test";
import assert from "node:assert/strict";
import { nextVersion, notes, type Commit } from "../scripts/release.ts";

const c = (subject: string, body = ""): Commit => ({ hash: "abc1234", subject, body });

test("nextVersion: the first release is 1.0.0", () => assert.equal(nextVersion(null, [c("feat: x")]), "1.0.0"));
test("nextVersion: fix is a patch, feat a minor, ! or BREAKING CHANGE a major", () => {
  assert.equal(nextVersion("v1.2.3", [c("fix: x"), c("docs: y")]), "1.2.4");
  assert.equal(nextVersion("v1.2.3", [c("fix: x"), c("feat(badges): y")]), "1.3.0");
  assert.equal(nextVersion("v1.2.3", [c("feat!: rename tokens")]), "2.0.0");
  assert.equal(nextVersion("v1.2.3", [c("refactor: x", "BREAKING CHANGE: tokens/colors.json moved")]), "2.0.0");
});
test("notes: grouped, each commit once, with the pinned link", () => {
  const n = notes("1.3.0", "v1.2.3", [c("feat: badges"), c("fix: icon size"), c("feat!: drop x")]);
  assert.match(n, /## Breaking changes\n\n- drop x/);
  assert.match(n, /## New and changed assets\n\n- badges \(abc1234\)\n\n/);
  assert.match(n, /## Fixes\n\n- icon size/);
  assert.match(n, /brand@1\//);
  assert.equal(n.match(/drop x/g)!.length, 1);
});
