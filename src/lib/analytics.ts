// Cookieless first-party analytics. Events go straight into the Supabase
// table `analytics_events`, which visitors can write to but never read.
// A random visitor id lives in localStorage; no IP address or cookie is used.
// Visiting any page with ?notrack=1 turns tracking off on that browser.
import { supabaseKey, supabaseUrl } from "@/lib/backend";
import { gaEvent, gaPageView } from "@/lib/ga";

type Row = Record<string, string | number | null>;

const enabled =
  typeof window !== "undefined" &&
  Boolean(supabaseUrl && supabaseKey) &&
  (!import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEBUG === "1");

let queue: Row[] = [];
let timer: number | undefined;
let page: { path: string; visible: number; since: number | null; scroll: number; left: boolean } | null = null;
let started = false;

function store(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function id(): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function remembered(kind: "local" | "session", key: string, make: () => string): string {
  const s = store(kind);
  const v = s?.getItem(key);
  if (v) return v;
  const fresh = make();
  s?.setItem(key, fresh);
  return fresh;
}

function optedOut(): boolean {
  const s = store("local");
  const q = new URLSearchParams(window.location.search).get("notrack");
  if (q === "1") s?.setItem("zt_notrack", "1");
  if (q === "0") s?.removeItem("zt_notrack");
  return s?.getItem("zt_notrack") === "1";
}

/** Where this session came from, captured once on the landing page. */
function landing(): Record<string, string | null> {
  const s = store("session");
  const saved = s?.getItem("zt_src");
  if (saved) return JSON.parse(saved);
  const q = new URLSearchParams(window.location.search);
  let referrer: string | null = null;
  try {
    const r = document.referrer ? new URL(document.referrer) : null;
    if (r && r.host !== window.location.host) referrer = r.host.replace(/^www\./, "");
  } catch {
    referrer = null;
  }
  const src = {
    referrer,
    utm_source: q.get("utm_source"),
    utm_medium: q.get("utm_medium"),
    utm_campaign: q.get("utm_campaign"),
    landing: window.location.pathname,
  };
  s?.setItem("zt_src", JSON.stringify(src));
  return src;
}

function device(): string {
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

function base(type: string, path: string): Row {
  const src = landing();
  return {
    type,
    path: path.slice(0, 300),
    visitor: remembered("local", "zt_v", id),
    session: remembered("session", "zt_s", id),
    referrer: src.referrer,
    utm_source: src.utm_source?.slice(0, 100) ?? null,
    utm_medium: src.utm_medium?.slice(0, 100) ?? null,
    utm_campaign: src.utm_campaign?.slice(0, 100) ?? null,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone?.slice(0, 64) ?? null,
    lang: navigator.language?.slice(0, 20) ?? null,
    device: device(),
  };
}

function push(row: Row, now = false) {
  if (!enabled || optedOut()) return;
  queue.push(row);
  if (now || queue.length >= 20) flush();
  else timer ??= window.setTimeout(flush, 4000);
}

export function flush() {
  window.clearTimeout(timer);
  timer = undefined;
  if (!queue.length) return;
  const body = JSON.stringify(queue);
  queue = [];
  fetch(`${supabaseUrl}/rest/v1/analytics_events`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: supabaseKey!, "Content-Type": "application/json", Prefer: "return=minimal" },
    body,
  }).catch(() => undefined);
}

/** "/about" and "/about/" are the same page; record the canonical form. */
function currentPath() {
  const p = window.location.pathname;
  return p.endsWith("/") ? p : `${p}/`;
}

/** One "leave" per page view: time actually visible and how far they scrolled. */
function leave() {
  if (!page || page.left) return;
  const visible = page.visible + (page.since ? Date.now() - page.since : 0);
  page.left = true;
  push({ ...base("leave", page.path), duration_ms: Math.min(visible, 86_400_000), scroll: page.scroll }, true);
}

function trackScroll() {
  if (!page) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const pct = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100);
  page.scroll = Math.max(page.scroll, Math.min(100, Math.max(0, pct)));
}

/** Call on every route change (and once on load). */
export function pageview() {
  if (typeof window === "undefined") return;
  start();
  const path = currentPath();
  if (page?.path === path) return;
  leave();
  page = { path, visible: 0, since: document.hidden ? null : Date.now(), scroll: 0, left: false };
  trackScroll();
  push(base("pageview", path), true);
  gaPageView(path);
}

/** A named conversion or interaction, e.g. track("book_open"). */
export function track(name: string, label?: string) {
  if (typeof window === "undefined") return;
  push({ ...base("event", currentPath()), name: name.slice(0, 60), label: label?.slice(0, 120) ?? null }, true);
  gaEvent(name, label ? { label } : undefined);
}

/** Source details saved with each lead so the dashboard can show what brought it in. */
export function sourceInfo(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  const src = landing();
  return { ...src, page: window.location.pathname, visitor: store("local")?.getItem("zt_v") ?? null };
}

function onClick(e: MouseEvent) {
  const el = (e.target as Element | null)?.closest<HTMLElement>("a, button, [data-track]");
  if (!el) return;
  const a = el.closest("a");
  const rawHref = a?.getAttribute("href") ?? "";
  const href = rawHref.startsWith("mailto:") ? rawHref.split("?")[0] : rawHref.split("#")[0] || rawHref;
  const label = (el.dataset.track || el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
  const doc = document.documentElement;
  push({
    ...base("click", currentPath()),
    label: label.slice(0, 120) || null,
    href: href.slice(0, 300) || null,
    x: Math.round((e.pageX / Math.max(doc.scrollWidth, 1)) * 1000) / 1000,
    y: Math.round(e.pageY),
  }, Boolean(a && rawHref && !rawHref.startsWith("#")));
  // A link whose default was cancelled (e.g. the booking button opening the
  // pop-up instead of its email fallback) is not an email/phone/WhatsApp click.
  if (e.defaultPrevented) return;
  if (href.includes("wa.me/")) track("whatsapp", label);
  else if (href.startsWith("tel:")) track("phone_click");
  else if (href.startsWith("mailto:")) track("email_click");
}

function start() {
  if (started || !enabled) return;
  started = true;
  // Bubble phase, so React's handlers have already run and defaultPrevented is known.
  document.addEventListener("click", onClick);
  window.addEventListener("scroll", trackScroll, { passive: true });
  // Phones rarely fire pagehide, so the first time the tab is hidden counts as leaving.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      leave();
      flush();
    }
  });
  window.addEventListener("pagehide", () => {
    leave();
    flush();
  });
}
