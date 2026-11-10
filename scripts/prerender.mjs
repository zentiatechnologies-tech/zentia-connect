// Runs after `vite build`. Renders every page to real HTML so search engines
// and link previews see the content and each page's own title, without
// needing to run JavaScript.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const { render, pages, canonical, site, faqs } = await import(
  pathToFileURL(join(root, "dist-ssr", "entry-server.js")).href
);

const template = readFileSync(join(dist, "index.html"), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  url: site.url,
  email: site.email,
  telephone: site.phoneDisplay,
  address: { "@type": "PostalAddress", addressLocality: "Kampala", addressCountry: "UG" },
  areaServed: "Africa",
  sameAs: site.socials.map((s) => s.href),
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const routes = [
  { meta: pages.home, url: "/", file: "index.html", schema: [orgSchema, faqSchema] },
  { meta: pages.about, url: "/about", file: "about/index.html", schema: [orgSchema] },
  { meta: pages.resources, url: "/resources", file: "resources/index.html", schema: [orgSchema] },
  { meta: pages.notFound, url: "/404", file: "404.html", schema: [], noindex: true },
];

for (const r of routes) {
  const link = canonical(r.meta);
  const head = [
    `<title>${esc(r.meta.title)}</title>`,
    `<meta name="description" content="${esc(r.meta.description)}" />`,
    r.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${link}" />`,
    `<meta property="og:title" content="${esc(r.meta.title)}" />`,
    `<meta property="og:description" content="${esc(r.meta.description)}" />`,
    `<meta property="og:url" content="${link}" />`,
    `<meta name="twitter:title" content="${esc(r.meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(r.meta.description)}" />`,
    ...r.schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`),
  ].join("\n    ");

  const html = template
    .replace(/<!--page-head-->[\s\S]*?<!--\/page-head-->/, head)
    .replace('<div id="root"></div>', `<div id="root" data-page="${r.url}">${render(r.url)}</div>`);

  const out = join(dist, r.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log("prerendered", r.file);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    routes
      .filter((r) => !r.noindex)
      .map((r) => `  <url><loc>${canonical(r.meta)}</loc><lastmod>${today}</lastmod></url>`)
      .join("\n") +
    `\n</urlset>\n`,
);
rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
