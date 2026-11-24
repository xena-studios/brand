import type { APIRoute } from "astro";
import { BRANDS } from "../lib/brands.ts";

export const GET: APIRoute = ({ site }) => {
  const pages = ["/", ...BRANDS.map((b) => `/${b.id}`), "/badges", "/files", "/building"];
  const urls = pages.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml" },
  });
};
