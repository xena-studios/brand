// The guides in docs/, as pages. Each guide keeps working on GitHub as it is; here its
// links are pointed at the site: another guide at its page, a brand file at the copy the
// site serves, and anything else (scripts, folders) at the source on GitHub at this release.
import path from "node:path";
import { Marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { REPO, read, ref, served, tracked } from "./repo.ts";

// Each guide's page.
export const PAGES: Record<string, string> = {
  "docs/xena.md": "/xena",
  "docs/raptor.md": "/raptor",
  "docs/neoskript.md": "/neoskript",
  "docs/mostwanted.md": "/mostwanted",
  "docs/airfields.md": "/airfields",
  "docs/plugins.md": "/plugins",
  "docs/badges.md": "/badges",
  "docs/where-files-go.md": "/files",
  "docs/building.md": "/building",
  "README.md": "/",
};

/** Where a link written in `from` (a repo path) should go on the site. */
export function resolve(href: string, from: string): string {
  if (/^([a-z]+:|#|\/\/)/i.test(href)) return href;
  const [target, hash = ""] = href.split("#");
  const file = path.posix.normalize(path.posix.join(path.posix.dirname(from), target)).replace(/\/$/, "");
  const anchor = hash ? `#${hash}` : "";
  if (PAGES[file]) return PAGES[file] + anchor;
  if (served(file)) return `/${file}${anchor}`;
  const isDir = !tracked().includes(file);
  return `${REPO}/${isDir ? "tree" : "blob"}/${ref}/${file}${anchor}`;
}

export interface Guide {
  title: string;
  /** The guide's opening line, shown as the page's lead. */
  lead: string;
  html: string;
}

/** A guide, rendered, with its title and opening line taken out for the page's hero. */
export function guide(file: string): Guide {
  let md = read(file);
  const title = md.match(/^# (.+)$/m)![1];
  md = md.replace(/^# .+\n+/m, "");
  // The lead: the first paragraph that's words, not a picture.
  const blocks = md.split(/\n{2,}/);
  const i = blocks.findIndex((b) => !/^\s*(!\[|<|#|\||```|- )/.test(b));
  const lead = i >= 0 && i < 3 ? blocks.splice(i, 1)[0].trim() : "";
  const marked = new Marked(gfmHeadingId());
  const inline = (s: string) => fix(marked.parseInline(s) as string, file);
  return { title, lead: inline(lead), html: fix(marked.parse(blocks.join("\n\n")) as string, file) };
}

function fix(html: string, file: string) {
  return html
    .replace(/\b(src|href)="([^"]*)"/g, (_, attr, url) => `${attr}="${resolve(url.replace(/&amp;/g, "&"), file).replace(/&/g, "&amp;")}"`)
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    // Pictures put side by side with &nbsp; in the Markdown.
    .replace(/(\s*&nbsp;\s*)+/g, " ")
    // Wide tables scroll inside their own box on a phone, not the page.
    .replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, "</table></div>")
    // Links that leave the site open as links do; mark them for the arrow style.
    .replace(/<a href="(https?:[^"]+)"/g, '<a class="out" href="$1"');
}
