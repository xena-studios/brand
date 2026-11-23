// Generates every Xena Studios brand asset from code: logos, avatar, social graphics,
// Raptor's, NeoSkript's and MostWanted's marks and banners, Airfields, the plugin family
// and the badges. All type is converted to outlines so no font file ever ships
// (Ethnocentric's desktop EULA forbids redistribution).
//
//   pnpm build            everything but logo/ and people/, from npm fonts alone
//   pnpm build --plugins  the plugin family, its cards and the badges
//   pnpm build --logos    logo/ and people/, which need Ethnocentric
//   --force               render every PNG, not only those whose SVG changed
//   --preview             write .preview/index.html afterwards (pnpm dev)
import path from "node:path";
import { buildAirfields } from "./airfields-brand.ts";
import { buildBadges } from "./badges.ts";
import { writer } from "./output.ts";
import { writePreview } from "./preview.ts";
import { buildLogos, buildXena, buildRepoCards } from "./art/xena.ts";
import { buildRaptor } from "./art/raptor.ts";
import { buildNeoskript } from "./art/neoskript.ts";
import { buildMostwanted } from "./art/mostwanted.ts";
import { buildPlugins } from "./art/plugins.ts";
import { writeDtcg } from "./dtcg.ts";

// Each brand's art is drawn in scripts/art/<brand>.ts (Airfields in airfields-brand.ts),
// from the colours, marks and copy in scripts/<brand>-brand.ts.

const ROOT = path.resolve(import.meta.dirname, "..");
const pluginsOnly = process.argv.includes("--plugins");
const logosOnly = process.argv.includes("--logos");

const written: string[] = [];
const out = writer(ROOT, written);

if (logosOnly) {
  // The only files drawn in Ethnocentric; every other graphic reads the logos back from logo/.
  buildLogos(out);
} else {
  // Everything but the plugin family; --plugins skips it.
  if (!pluginsOnly) {
    buildXena(out);
    buildRaptor(out);
    buildNeoskript(out);
    buildMostwanted(out);
    // Also runs alone: pnpm build:airfields.
    buildAirfields(out);
  }
  buildRepoCards(out);
  buildPlugins(out);
  // The badges, in every brand's colours and each plugin's (scripts/badges.ts). Also
  // runs alone: pnpm build:badges.
  buildBadges(out);
  // Every brand's colours in the W3C design tokens format, from the JSON just written.
  writeDtcg();
}

await out.flush();
console.log(`wrote ${written.length} svgs (+png)`);
// pnpm dev: the preview page, rewritten after every rebuild.
if (process.argv.includes("--preview")) console.log(`preview: ${path.relative(process.cwd(), writePreview())}`);
