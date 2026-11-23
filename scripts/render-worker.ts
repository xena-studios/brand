// Renders one PNG per message, for output.ts's pool: the SVG at the given width, with no
// system fonts (every letter is already an outline), written beside its SVG.
import fs from "node:fs";
import { parentPort } from "node:worker_threads";
import { Resvg } from "@resvg/resvg-js";
import type { RenderJob } from "./output.ts";

parentPort!.on("message", ({ svg, png, width }: RenderJob) => {
  fs.writeFileSync(png, new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { loadSystemFonts: false } }).render().asPng());
  parentPort!.postMessage("done");
});
