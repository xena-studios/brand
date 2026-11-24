// The brand repo the site is built from: its files, and which release it is.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// From git, not this file's path: Astro bundles this module somewhere else when it builds.
export const ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
export const REPO = "https://github.com/xena-studios/brand";

// The folders whose files the site serves at their repo paths (scripts/public.ts).
export const FILE_DIRS = [
  "logo", "avatar", "social", "scene", "github", "people", "workspace",
  "raptor", "neoskript", "mostwanted", "airfields", "plugins", "badges", "tokens",
];

const git = (...args: string[]) => execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8" }).trim();

let files: string[] | undefined;
/** Every file git tracks, as repo paths. */
export function tracked(): string[] {
  return (files ??= git("ls-files").split("\n").filter(Boolean));
}

/** Whether the site serves this repo path. */
export const served = (f: string) => FILE_DIRS.includes(f.split("/")[0]) && tracked().includes(f);

/**
 * The release this build is: the tag on HEAD (the Release workflow builds the site from
 * the commit it just tagged), or null for any other commit.
 */
const tag = (...args: string[]) => {
  try {
    return execFileSync("git", ["-C", ROOT, "describe", "--tags", "--match", "v[0-9]*", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null; // no tags in a shallow checkout
  }
};
export const release = tag("--exact-match");

/** The git ref links to source files point at: the release, or main. */
export const ref = release ?? "main";
/** The major version, for jsDelivr links (`brand@1`). */
export const major = (release ?? tag("--abbrev=0") ?? "v1").replace(/^v/, "").split(".")[0];
export const CDN = `https://cdn.jsdelivr.net/gh/xena-studios/brand@${major}`;
export const PRESS_KIT = `${REPO}/releases/latest/download/xena-studios-press-kit.zip`;

export const read = (f: string) => fs.readFileSync(path.join(ROOT, f), "utf8");
