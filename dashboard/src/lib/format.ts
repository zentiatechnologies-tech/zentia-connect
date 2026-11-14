const TZ = "Africa/Kampala";

export const num = (n: number | null | undefined) => (n == null ? "–" : new Intl.NumberFormat("en-GB").format(n));

export const pct = (n: number | null | undefined, digits = 0) =>
  n == null ? "–" : `${Number(n).toFixed(digits)}%`;

export const ugx = (n: number | null | undefined) => (n == null ? "–" : `UGX ${num(n)}`);

export function duration(s: number | null | undefined) {
  if (s == null) return "–";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

export function dateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function dayLabel(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(iso));
}

export function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return dateTime(iso).replace(/,? \d\d:\d\d$/, "");
}

/** Percentage change, or null when there is too little to compare. */
export function change(cur: number | null, prev: number | null) {
  if (cur == null || prev == null || prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

export const topicLabels: Record<string, string> = {
  audit: "AI Readiness Audit",
  strategy: "Strategy Consulting",
  builds: "Custom Builds",
  training: "Training & Workshops",
  unsure: "Not sure yet",
};

export const kindLabels: Record<string, string> = {
  booking: "Booked call",
  consult: "Tool Hub consult",
  workshop: "Workshop",
};

export const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Call booked",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

export const eventLabels: Record<string, string> = {
  book_open: "Opened booking form",
  book_details: "Sent booking details",
  book_done: "Picked a call time",
  whatsapp: "WhatsApp clicks",
  email_click: "Email link clicks",
  phone_click: "Phone link clicks",
  consult_sent: "Tool Hub consult requests",
  suggest_sent: "Tool suggestions",
  rate: "Tool ratings",
  hub_plan: "Tool Hub plans made",
};

export function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "").replace(/^0/, "256");
  return digits.length >= 9 ? `https://wa.me/${digits}` : null;
}

export function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
