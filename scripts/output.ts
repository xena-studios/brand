// Writes a generated SVG and its PNG. Shared by build.ts and the scripts that can also run
// on their own (airfields-brand.ts, badges.ts), so every file is written the same way.
//
// Rendering PNGs is nearly all of a build's time, so:
//   - a PNG is rendered only when its SVG changed (or the PNG is missing). The SVG is the
//     whole input, so an unchanged one renders the same PNG. `--force` renders them all,
//     for a new resvg, or to check nothing was edited by hand (`pnpm check` does).
//   - renders are queued, and `flush()` spreads them over every CPU core.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";

// Renames every id in a file after the file itself (github/brand.svg's glow is
// "github-brand-glow"). The ids handed out count across the whole build, so
// without this, adding one graphic renumbers every file after it, and the sites
// that inline these SVGs get changes that change nothing. Prefixing with the
// file keeps ids unique when several are inlined on one page.
export function scopeIds(rel: string, svg: string) {
  const slug = rel.replace(/\.svg$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const seen = new Map<string, number>();
  const rename = new Map<string, string>();
  for (const [, old] of svg.matchAll(/ id="([^"]+)"/g)) {
    const base = `${slug}-${old.replace(/\d+/g, "")}`, n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    rename.set(old, n === 1 ? base : `${base}-${n}`);
  }
  return svg.replace(/( id="|url\(#|href="#)([^")]+)/g, (m, pre: string, old: string) => rename.has(old) ? pre + rename.get(old) : m);
}

export interface RenderJob { svg: string; png: string; width: number }

export type Out = ((rel: string, svg: string, pngWidth: number) => void) & {
  /** Renders every queued PNG, in parallel. Call once at the end of a build. */
  flush: () => Promise<void>;
};

const force = process.argv.includes("--force");

/** An `out` that writes under `root` and records each file in `written`. */
export function writer(root: string, written: string[] = []): Out {
  const jobs: RenderJob[] = [];
  const out = ((rel, svg, pngWidth) => {
    const file = path.join(root, rel), png = file.replace(/\.svg$/, ".png");
    svg = scopeIds(rel, svg);
    written.push(rel);
    let old: string | null = null;
    try {
      old = fs.readFileSync(file, "utf8");
    } catch {
      // New file.
    }
    if (old === svg && !force && fs.existsSync(png)) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (old !== svg) fs.writeFileSync(file, svg);
    jobs.push({ svg, png, width: pngWidth });
  }) as Out;
  out.flush = () => render(jobs.splice(0));
  return out;
}

/** Renders the jobs on a pool of worker threads, biggest first so none is left for last. */
export async function render(jobs: RenderJob[]) {
  if (!jobs.length) return;
  jobs.sort((a, b) => b.width * b.svg.length - a.width * a.svg.length);
  const threads = Math.min(jobs.length, Math.max(1, os.availableParallelism() - 1));
  let next = 0;
  await Promise.all(Array.from({ length: threads }, () => new Promise<void>((resolve, reject) => {
    const worker = new Worker(new URL("./render-worker.ts", import.meta.url));
    const give = () => {
      if (next < jobs.length) worker.postMessage(jobs[next++]);
      else worker.terminate().then(() => resolve(), reject);
    };
    worker.on("message", give);
    worker.on("error", reject);
    give();
  })));
}
