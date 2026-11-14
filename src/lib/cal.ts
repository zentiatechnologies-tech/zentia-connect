// Loads the official Cal.com embed and shows a booking calendar inside an
// element. Cal.com books into the connected Google Calendar and emails the
// invite, so the website never touches the calendar itself.
type CalApi = ((...args: unknown[]) => void) & { ns?: Record<string, CalApi>; q?: unknown[]; loaded?: boolean };

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

const NS = "zentia";
const BRAND = "#01C684";
let ready = false;
let onBooked: ((detail: unknown) => void) | null = null;

function load(): CalApi {
  // Cal.com's own loader snippet, unchanged apart from formatting.
  /* eslint-disable */
  (function (C: any, A: string, L: string) {
    const p = function (a: any, ar: any) { a.q.push(ar); };
    const d = C.document;
    C.Cal = C.Cal || function () {
      const cal = C.Cal; const ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        const api: any = function () { p(api, arguments); };
        const namespace = ar[1]; api.q = api.q || [];
        if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");
  /* eslint-enable */
  return window.Cal!;
}

export type Prefill = { name: string; email: string; notes: string; ref: string };

export function showCalendar(el: HTMLElement, calLink: string, prefill: Prefill, booked: (detail: unknown) => void) {
  const Cal = load();
  onBooked = booked;
  if (!ready) {
    ready = true;
    Cal("init", NS, { origin: "https://cal.com" });
    const ns = Cal.ns![NS];
    ns("ui", {
      theme: "light",
      hideEventTypeDetails: false,
      layout: "month_view",
      cssVarsPerTheme: { light: { "cal-brand": BRAND }, dark: { "cal-brand": BRAND } },
    });
    const handler = (e: { detail?: unknown }) => onBooked?.(e?.detail);
    ns("on", { action: "bookingSuccessfulV2", callback: handler });
    ns("on", { action: "bookingSuccessful", callback: handler });
  }
  el.replaceChildren();
  Cal.ns![NS]("inline", {
    elementOrSelector: el,
    calLink,
    config: {
      layout: "month_view",
      theme: "light",
      name: prefill.name,
      email: prefill.email,
      notes: prefill.notes,
      "metadata[ref]": prefill.ref,
    },
  });
}
