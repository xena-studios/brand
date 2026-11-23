// Works out the next release from the commits since the last one, and writes its notes.
// Commits follow Conventional Commits, so the version follows from them: a breaking change
// (`feat!:`, or "BREAKING CHANGE" in the body) is a major release, a `feat:` a minor one,
// anything else a patch. The first release is v1.0.0.
//
// Run by the Release workflow (.github/workflows/release.yml), which tags the commit and
// publishes the notes as a GitHub release. Locally, to see what the next release would be:
//
//   pnpm release:notes
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();

export interface Commit { hash: string; subject: string; body: string }

/** The last release tag (vX.Y.Z) reachable from HEAD, or null before the first. */
export function lastTag(): string | null {
  try {
    return execFileSync("git", ["describe", "--tags", "--abbrev=0", "--match", "v[0-9]*.[0-9]*.[0-9]*"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

const SEP = "\u001e", FIELD = "\u001f";
export function commitsSince(tag: string | null): Commit[] {
  const range = tag ? [`${tag}..HEAD`] : ["HEAD"];
  const out = git("log", "--no-merges", `--format=%h${FIELD}%s${FIELD}%b${SEP}`, ...range);
  return out.split(SEP).map((c) => c.trim()).filter(Boolean).map((c) => {
    const [hash, subject, body = ""] = c.split(FIELD);
    return { hash, subject, body };
  });
}

const TYPE = /^(\w+)(\([^)]*\))?(!)?:\s*(.+)$/;
const breaking = (c: Commit) => TYPE.exec(c.subject)?.[3] === "!" || /^BREAKING[ -]CHANGE:/m.test(c.body);
const type = (c: Commit) => TYPE.exec(c.subject)?.[1] ?? "other";

/** The next version after `tag`, from what the commits are. */
export function nextVersion(tag: string | null, commits: Commit[]): string {
  if (!tag) return "1.0.0";
  const [major, minor, patch] = tag.replace(/^v/, "").split(".").map(Number);
  if (commits.some(breaking)) return `${major + 1}.0.0`;
  if (commits.some((c) => type(c) === "feat")) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const SECTIONS: [string, (c: Commit) => boolean][] = [
  ["Breaking changes", breaking],
  ["New and changed assets", (c) => type(c) === "feat"],
  ["Fixes", (c) => type(c) === "fix"],
  ["Docs", (c) => type(c) === "docs"],
  ["Build and tooling", (c) => ["build", "ci", "chore", "refactor", "test", "perf"].includes(type(c))],
  ["Other", () => true],
];

/** Release notes: the commits grouped by what they are, each under the first heading it fits. */
export function notes(version: string, tag: string | null, commits: Commit[]): string {
  const left = [...commits];
  const lines: string[] = [];
  for (const [heading, fits] of SECTIONS) {
    const these = left.filter(fits);
    if (!these.length) continue;
    for (const c of these) left.splice(left.indexOf(c), 1);
    lines.push(`## ${heading}`, "", ...these.map((c) => `- ${(TYPE.exec(c.subject)?.[4] ?? c.subject)} (${c.hash})`), "");
  }
  const pin = `https://cdn.jsdelivr.net/gh/xena-studios/brand@${version.split(".")[0]}/`;
  lines.push(
    "## Using it",
    "",
    `Link files from jsDelivr pinned to this major version, such as \`${pin}badges/xena/compact/modrinth.svg\`: links follow every v${version.split(".")[0]} release, and never a breaking one.`,
  );
  if (tag) lines.push("", `Every change: https://github.com/xena-studios/brand/compare/${tag}...v${version}`);
  return lines.join("\n") + "\n";
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const tag = lastTag(), commits = commitsSince(tag);
  if (!commits.length) {
    console.error(`Nothing to release: no commits since ${tag}.`);
    process.exit(1);
  }
  const version = nextVersion(tag, commits);
  // The workflow reads these two.
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
  fs.writeFileSync(process.argv[2] ?? "release-notes.md", notes(version, tag, commits));
  console.log(`v${version}, from ${commits.length} commits since ${tag ?? "the start"}`);
}
