// A local page with every asset on it, grouped by folder, to review a change at a glance:
// what changed since the last commit is marked and can be shown alone, and the background
// switches between dark, light and a checkerboard (for transparency). Written to
// .preview/index.html, which git ignores; open it in a browser. `pnpm dev` rewrites it on
// every rebuild.
//
//   pnpm preview
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".preview");
const git = (...args: string[]) => execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8" });

export function writePreview() {
  const files = [...new Set([
    ...git("ls-files", "*.png").split("\n"),
    ...git("ls-files", "--others", "--exclude-standard", "*.png").split("\n"),
  ])].filter((f) => f && fs.existsSync(path.join(ROOT, f))).sort();
  // Changed: modified, added or untracked since HEAD, by PNG or by the SVG it's drawn from.
  const changed = new Set(git("status", "--porcelain", "--untracked-files=all").split("\n")
    .map((l) => l.slice(3).trim()).filter(Boolean).map((f) => f.replace(/\.svg$/, ".png")));
  const groups = new Map<string, string[]>();
  for (const f of files) {
    const dir = path.posix.dirname(f);
    groups.set(dir, [...(groups.get(dir) ?? []), f]);
  }
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const sections = [...groups].map(([dir, list]) => {
    const tiles = list.map((f) => {
      const c = changed.has(f);
      return `<figure class="tile${c ? " changed" : ""}"><a href="../${esc(f)}"><img loading="lazy" src="../${esc(f)}" alt=""></a><figcaption>${c ? "<b>changed</b> " : ""}${esc(path.posix.basename(f))}</figcaption></figure>`;
    }).join("");
    const n = list.filter((f) => changed.has(f)).length;
    return `<section class="${n ? "has-changes" : ""}"><h2>${esc(dir)} <small>${list.length} files${n ? `, ${n} changed` : ""}</small></h2><div class="grid">${tiles}</div></section>`;
  }).join("");
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brand preview</title>
<style>
:root{color-scheme:dark;--bg:#06080D;--panel:#121824;--line:#222B3B;--text:#EDF1F7;--muted:#8A93A6;--accent:#5CB4FF}
body{margin:0;background:#06080D;color:var(--text);font:14px/1.5 ui-monospace,"JetBrains Mono",monospace}
header{position:sticky;top:0;z-index:1;display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:#0A0E16;border-bottom:1px solid var(--line)}
header b{color:var(--accent)}button{font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:4px 10px;cursor:pointer}
button[aria-pressed=true]{border-color:var(--accent);color:var(--accent)}
main{padding:0 16px 48px}h2{font-size:15px;margin:28px 0 10px}small{color:var(--muted);font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.tile{margin:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--panel)}
.tile a{display:grid;place-items:center;min-height:120px;padding:12px;background:var(--stage,#0A0E16)}
.tile img{max-width:100%;max-height:180px}.tile figcaption{padding:6px 10px;color:var(--muted);overflow-wrap:anywhere}
.tile.changed{border-color:var(--accent)}.tile.changed b{color:var(--accent)}
body.light{--stage:#F6F7FB}body.checker{--stage:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/16px 16px}
body.only-changed section:not(.has-changes),body.only-changed .tile:not(.changed){display:none}
</style>
<header><b>Brand preview</b><span>${files.length} images, ${[...changed].filter((f) => files.includes(f)).length} changed</span>
<button data-toggle="only-changed" aria-pressed="false">Only changed</button>
<button data-stage="" aria-pressed="true">Dark</button><button data-stage="light" aria-pressed="false">Light</button><button data-stage="checker" aria-pressed="false">Checker</button></header>
<main>${sections}</main>
<script>
const b=document.body;
document.querySelectorAll("[data-toggle]").forEach(e=>e.onclick=()=>e.setAttribute("aria-pressed",b.classList.toggle(e.dataset.toggle)));
document.querySelectorAll("[data-stage]").forEach(e=>e.onclick=()=>{b.classList.remove("light","checker");if(e.dataset.stage)b.classList.add(e.dataset.stage);document.querySelectorAll("[data-stage]").forEach(o=>o.setAttribute("aria-pressed",o===e))});
</script>`;
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.html"), html);
  return path.join(OUT, "index.html");
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  console.log(`wrote ${path.relative(process.cwd(), writePreview())}`);
}
