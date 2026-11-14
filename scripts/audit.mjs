// Checks every built page in dist/ for the SEO basics and, when
// DASHBOARD_INGEST_TOKEN is set (in GitHub Actions), sends the results and a
// change-log entry for this deploy to the dashboard.
//   node scripts/audit.mjs            print the check
//   node scripts/audit.mjs --report   also send it to the dashboard
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === "assets" ? [] : htmlFiles(p);
    return f.endsWith(".html") ? [p] : [];
  });
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ?? null;
const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function exists(href) {
  const path = href.split(/[?#]/)[0];
  if (!path || path === "/") return true;
  const p = join(DIST, path);
  return existsSync(p) && (statSync(p).isFile() || existsSync(join(p, "index.html")));
}

function audit(file) {
  const html = readFileSync(file, "utf8");
  const rel = "/" + relative(DIST, file).replace(/\\/g, "/");
  const path = rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel;
  const notFound = path === "/404.html";

  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "");
  const metaTags = html.match(/<meta\s[^>]*>/gi) ?? [];
  const meta = (key, val) => metaTags.find((t) => attr(t, key) === val);
  const description = decode(attr(meta("name", "description") ?? "", "content") ?? "");
  const ogImage = attr(meta("property", "og:image") ?? "", "content");
  const canonical = attr((html.match(/<link\s[^>]*rel="canonical"[^>]*>/i) ?? [""])[0], "href");

  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
  const h1s = (body.match(/<h1[\s>]/gi) ?? []).length;
  const imgs = body.match(/<img\s[^>]*>/gi) ?? [];
  const noAlt = imgs.filter((t) => attr(t, "alt") === null).length;
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  const words = text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
  const links = [...body.matchAll(/<a\s[^>]*href="(\/[^"]*)"/gi)].map((m) => m[1]);
  const broken = [...new Set(links.filter((h) => !h.startsWith("//") && !exists(h)))];

  const issues = [];
  if (!title) issues.push("Missing page title");
  else if (title.length > 65) issues.push(`Title is long (${title.length} characters; Google shows about 60)`);
  else if (title.length < 15) issues.push(`Title is short (${title.length} characters)`);
  if (!notFound) {
    if (!description) issues.push("Missing meta description");
    else if (description.length < 70) issues.push(`Description is short (${description.length} characters; aim for 70–160)`);
    else if (description.length > 165) issues.push(`Description is long (${description.length} characters; aim for 70–160)`);
    if (!canonical) issues.push("Missing canonical link");
    if (!ogImage) issues.push("Missing share image (og:image)");
    if (words < 250) issues.push(`Thin content (${words} words)`);
  }
  if (h1s !== 1) issues.push(h1s ? `${h1s} main headings (H1); use one` : "No main heading (H1)");
  if (noAlt) issues.push(`${noAlt} image${noAlt > 1 ? "s have" : " has"} no description (alt text)`);
  for (const b of broken) issues.push(`Broken link to ${b}`);

  return {
    path,
    title,
    description,
    h1_count: h1s,
    word_count: words,
    images: imgs.length,
    images_no_alt: noAlt,
    canonical,
    issues,
  };
}

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(".env.production", "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim();
  } catch {
    return undefined;
  }
}

async function rpc(fn, args) {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${fn}: ${res.status} ${await res.text()}`);
}

const pages = htmlFiles(DIST).sort().map(audit);
for (const p of pages) {
  console.log(`${p.issues.length ? "✗" : "✓"} ${p.path}  (${p.word_count} words)`);
  for (const i of p.issues) console.log(`    - ${i}`);
}

const token = process.env.DASHBOARD_INGEST_TOKEN;
if (process.argv.includes("--report")) {
  if (!token) {
    console.log("\nDASHBOARD_INGEST_TOKEN is not set, so nothing was sent to the dashboard.");
  } else {
    const sha = process.env.GITHUB_SHA ?? null;
    const message = (process.env.COMMIT_MESSAGE ?? "Website update").split("\n");
    try {
      await rpc("ingest_page_audit", { p_token: token, p_commit: sha, p_pages: pages });
      await rpc("ingest_site_change", {
        p_token: token,
        p_change: {
          kind: "deploy",
          title: message[0].slice(0, 300),
          detail: message.slice(1).filter((l) => l.trim() && !/^(Co-Authored-By|Claude-Session):/i.test(l)).join("\n").trim() || null,
          commit_sha: sha,
          author: process.env.GITHUB_ACTOR ?? null,
        },
      });
      console.log(`\nSent ${pages.length} page checks and the change-log entry to the dashboard.`);
    } catch (e) {
      // Reporting must never fail the deploy itself.
      console.log(`\nCould not reach the dashboard: ${e.message}`);
    }
  }
}
