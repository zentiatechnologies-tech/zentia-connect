// Tool Hub backend: Supabase reads and writes. Everything here is optional.
// Without the backend, the page runs from the built-in catalog and sends
// suggestions and consult requests by email or WhatsApp.
import { client, withSession } from "@/lib/backend";
import { sourceInfo } from "@/lib/analytics";
import type { Stats, Tool } from "./model";

export { backendEnabled } from "@/lib/backend";

export type HubData = {
  tools: Tool[] | null;
  stats: Stats;
  /** profession -> tool ids in rank order, from the nightly refresh */
  picks: Record<string, string[]>;
  /** this visitor's own ratings: tool id -> stars */
  mine: Record<string, number>;
};

export async function loadHub(): Promise<HubData> {
  const db = await client();
  const [tools, stats, picks, session] = await Promise.all([
    db.from("tools").select("*"),
    db.from("rating_stats").select("tool_id, prof, votes, total"),
    db.from("daily_picks").select("prof, rank, tool_id").order("rank"),
    db.auth.getSession(),
  ]);

  const out: HubData = { tools: null, stats: {}, picks: {}, mine: {} };
  if (tools.data?.length) out.tools = tools.data as Tool[];

  for (const r of stats.data ?? []) {
    const s = (out.stats[r.tool_id] ??= { votes: 0, total: 0, byProf: {} });
    s.votes += r.votes;
    s.total += r.total;
    if (r.prof) s.byProf[r.prof] = { votes: r.votes, total: r.total };
  }
  for (const p of picks.data ?? []) (out.picks[p.prof] ??= []).push(p.tool_id);

  if (session.data.session) {
    const { data } = await db.from("ratings").select("tool_id, stars");
    for (const r of data ?? []) out.mine[r.tool_id] = r.stars;
  }
  return out;
}

export async function rateTool(toolId: string, stars: number, prof: string | null) {
  const db = await withSession();
  const { error } = await db
    .from("ratings")
    .upsert(
      { tool_id: toolId, stars, prof, updated_at: new Date().toISOString() },
      { onConflict: "tool_id,user_id" },
    );
  if (error) throw error;
}

export async function suggestTool(s: { tool_name: string; url: string; note: string; prof: string | null }) {
  const db = await withSession();
  const { error } = await db.from("suggestions").insert({
    tool_name: s.tool_name.trim(),
    url: s.url.trim() || null,
    note: s.note.trim() || null,
    prof: s.prof,
  });
  if (error) throw error;
}

export async function requestConsult(l: {
  name: string;
  contact: string;
  message: string;
  prof: string | null;
  toolkit: string[];
}) {
  const db = await withSession();
  const { error } = await db.from("leads").insert({
    name: l.name.trim(),
    contact: l.contact.trim(),
    message: l.message.trim() || null,
    prof: l.prof,
    toolkit: l.toolkit,
    source: sourceInfo(),
  });
  if (error) throw error;
}
