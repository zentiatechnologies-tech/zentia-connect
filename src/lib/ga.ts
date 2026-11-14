// Google Analytics 4, loaded only after the visitor accepts. Set VITE_GA_ID
// (e.g. G-XXXXXXX) in .env.production to switch it on.
type Gtag = (...args: unknown[]) => void;

export const gaId = (import.meta.env.VITE_GA_ID as string | undefined) || "";
const KEY = "zt_ga_consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let loaded = false;

export function gaConsent(): "yes" | "no" | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

export function setGaConsent(v: "yes" | "no") {
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    /* private mode: ask again next time */
  }
  if (v === "yes") loadGa();
}

export function loadGa() {
  if (loaded || !gaId || typeof window === "undefined" || gaConsent() !== "yes") return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // Page views are sent by the router listener, not automatically.
  window.gtag("config", gaId, { send_page_view: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(s);
  gaPageView(window.location.pathname);
}

export function gaPageView(path: string) {
  if (!loaded || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
}

export function gaEvent(name: string, params?: Record<string, string>) {
  if (!loaded || !window.gtag) return;
  window.gtag("event", name, params);
}
