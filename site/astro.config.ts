import { defineConfig } from "astro/config";

// brand.xenastudios.co: static, no JavaScript, the same setup as xenastudios.co.
// The pages read the guides (docs/), tokens and files straight from the repo root;
// scripts/public.ts copies the files the site serves into .public/ first.
export default defineConfig({
  site: "https://brand.xenastudios.co",
  output: "static",
  publicDir: "./.public",
  trailingSlash: "never",
  build: {
    format: "file",
    // Hashed CSS and fonts go to /assets/, which _headers caches for good.
    assets: "assets",
    // The CSP (static/_headers) allows only same-origin styles: no inline <style>.
    inlineStylesheets: "never",
  },
  vite: {
    build: { assetsInlineLimit: 0 },
    // The pages import the logos and the horizon from the repo root.
    server: { fs: { allow: [".."] } },
  },
});
