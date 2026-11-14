import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const db = createClient(url, key, {
  auth: { storageKey: "zentia-dashboard-auth", flowType: "pkce", persistSession: true, autoRefreshToken: true },
});

export const SITE = "https://zentiaai.com";

export type Totals = {
  visitors: number;
  sessions: number;
  pageviews: number;
  bounce_rate: number | null;
  avg_session_s: number | null;
  mobile_share: number | null;
  conversions: number;
  conversion_rate: number | null;
  leads: number;
  bookings: number;
  book_opens: number;
  book_details: number;
  book_done: number;
  whatsapp_clicks: number;
  hub_ratings: number;
  hub_suggestions: number;
};

export type Traffic = {
  from: string;
  to: string;
  totals: Totals;
  daily: { day: string; visitors: number; pageviews: number }[];
  pages: { path: string; views: number; visitors: number; avg_time_s: number | null; avg_scroll: number | null; entries: number; bounces: number }[];
  referrers: { source: string; sessions: number; conversions: number }[];
  campaigns: { source: string; medium: string; campaign: string; sessions: number; conversions: number }[];
  countries: { country: string; code: string; visitors: number; conversions: number }[];
  devices: { device: string; sessions: number }[];
  clicks: { path: string; label: string; href: string; clicks: number }[];
  events: Record<string, number>;
  changes: { at: string; kind: string; title: string }[];
};

export type Insight = { tone: "good" | "warn" | "info" | "action"; text: string };

export type Digest = {
  period: "daily" | "weekly" | "monthly";
  label: string;
  from: string;
  to: string;
  totals: Totals;
  previous: Totals;
  insights: Insight[];
  top_pages: Traffic["pages"];
  top_sources: Traffic["referrers"];
  countries: Traffic["countries"];
  leads: { name: string; company: string | null; kind: string; topic: string | null; contact: string; at: string }[];
  upcoming: { name: string; start_at: string; meeting_url: string | null }[];
};

export type Lead = {
  id: number;
  created_at: string;
  updated_at: string;
  kind: "consult" | "booking" | "workshop";
  name: string;
  contact: string;
  email: string | null;
  company: string | null;
  prof: string | null;
  topic: string | null;
  message: string | null;
  toolkit: string[];
  source: Record<string, string | null>;
  status: LeadStatus;
  notes: string | null;
  value_ugx: number | null;
};

export type LeadStatus = "new" | "contacted" | "booked" | "qualified" | "won" | "lost";

export type Booking = {
  id: number;
  uid: string;
  lead_id: number | null;
  status: "booked" | "rescheduled" | "cancelled" | "completed" | "no_show";
  title: string | null;
  start_at: string;
  end_at: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_tz: string | null;
  meeting_url: string | null;
  notes: string | null;
};

export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export async function rows<T>(q: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}
