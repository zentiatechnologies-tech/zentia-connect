import { Link } from "react-router-dom";
import { Check, ExternalLink, Star, X } from "lucide-react";
import { db, rows, SITE } from "@d/lib/db";
import { ago, num } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { useRange } from "@d/Shell";
import { BarList, Card, ErrorNote, Kpi, Loading, Page } from "@d/ui";

type ToolRow = { id: string; name: string; cat: string; editor: number; trusted: boolean; active: boolean };
type Stat = { tool_id: string; prof: string; votes: number; total: number };
type Rating = { tool_id: string; stars: number; prof: string | null; updated_at: string };
type Suggestion = { id: number; tool_name: string; url: string | null; note: string | null; prof: string | null; status: string; created_at: string };
type Pick = { prof: string; rank: number; tool_id: string; score: number };

export default function ToolHub() {
  const { range } = useRange();
  const { data, error, loading, reload, setData } = useData(async () => {
    const [tools, stats, recent, suggestions, picks, consults, ratingCount] = await Promise.all([
      rows<ToolRow>(db.from("tools").select("id, name, cat, editor, trusted, active")),
      rows<Stat>(db.from("rating_stats").select("*")),
      rows<Rating>(db.from("ratings").select("tool_id, stars, prof, updated_at").order("updated_at", { ascending: false }).limit(40)),
      rows<Suggestion>(db.from("suggestions").select("*").order("created_at", { ascending: false }).limit(100)),
      rows<Pick>(db.from("daily_picks").select("*").order("rank")),
      db.from("leads").select("id", { count: "exact", head: true }).eq("kind", "consult").gte("created_at", range.from),
      db.from("ratings").select("tool_id", { count: "exact", head: true }).gte("updated_at", range.from),
    ]);
    return { tools, stats, recent, suggestions, picks, consults: consults.count ?? 0, ratings: ratingCount.count ?? 0 };
  }, [range.from]);

  const review = async (s: Suggestion, status: "approved" | "rejected") => {
    setData((cur) => (cur ? { ...cur, suggestions: cur.suggestions.map((x) => (x.id === s.id ? { ...x, status } : x)) } : cur));
    const { error } = await db.from("suggestions").update({ status }).eq("id", s.id);
    if (error) {
      alert(`Couldn't save: ${error.message}`);
      reload();
    }
  };

  return (
    <Page title="Tool Hub" sub="How visitors use the Tool Hub: ratings, suggestions and consult requests.">
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && (() => {
        const name = (id: string) => data.tools.find((t) => t.id === id)?.name ?? id;
        const per = new Map<string, { votes: number; total: number }>();
        for (const s of data.stats) {
          const p = per.get(s.tool_id) ?? { votes: 0, total: 0 };
          per.set(s.tool_id, { votes: p.votes + s.votes, total: p.total + s.total });
        }
        const rated = [...per.entries()].filter(([, s]) => s.votes > 0);
        const topRated = rated
          .map(([id, s]) => ({ id, avg: s.total / s.votes, votes: s.votes }))
          .sort((a, b) => b.avg - a.avg || b.votes - a.votes)
          .slice(0, 10);
        const mostRated = [...rated].sort((a, b) => b[1].votes - a[1].votes).slice(0, 10);
        const pending = data.suggestions.filter((s) => s.status === "pending");
        const picksBy = new Map<string, Pick[]>();
        for (const p of data.picks) picksBy.set(p.prof, [...(picksBy.get(p.prof) ?? []), p]);

        return (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
              <Kpi label="Tools in the hub" value={num(data.tools.filter((t) => t.active).length)} />
              <Kpi label={`Ratings (last ${range.days} days)`} value={num(data.ratings)} />
              <Kpi label="Suggestions to review" value={num(pending.length)} />
              <Kpi label={`Consult requests (last ${range.days} days)`} value={<Link to="/leads" className="hover:underline">{num(data.consults)}</Link>} />
            </div>

            <Card title={`Suggestions to review (${pending.length})`} action={<a className="inline-flex items-center gap-1 text-sm d-link" href={`${SITE}/tools/`} target="_blank" rel="noopener noreferrer">Open Tool Hub <ExternalLink size={14} /></a>}>
              {data.suggestions.length ? (
                <ul className="flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
                  {data.suggestions.slice(0, 30).map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {s.url ? <a className="d-link" href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.tool_name}</a> : s.tool_name}
                          {s.prof && <span className="ml-2 d-badge">{s.prof}</span>}
                        </p>
                        {s.note && <p className="text-sm d-muted">{s.note}</p>}
                        <p className="text-xs d-muted">{ago(s.created_at)}</p>
                      </div>
                      {s.status === "pending" ? (
                        <span className="flex gap-2">
                          <button type="button" className="d-btn d-btn-ghost d-btn-sm" onClick={() => review(s, "approved")}><Check size={16} /> Worth adding</button>
                          <button type="button" className="d-btn d-btn-ghost d-btn-sm" onClick={() => review(s, "rejected")}><X size={16} /> Skip</button>
                        </span>
                      ) : (
                        <span className={`d-badge ${s.status === "approved" ? "d-badge-green" : ""}`}>{s.status === "approved" ? "Worth adding" : "Skipped"}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="d-empty">No suggestions yet. Visitors can suggest tools at the bottom of the Tool Hub.</p>
              )}
              {data.suggestions.some((s) => s.status === "approved") && (
                <p className="mt-3 text-sm d-muted">Approved tools are added to the catalogue in the next website update.</p>
              )}
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Highest rated by visitors">
                <BarList
                  format={(n) => n.toFixed(1)}
                  items={topRated.map((r) => ({
                    key: r.id,
                    label: name(r.id),
                    value: r.avg,
                    extra: <span className="text-xs font-normal d-muted">{r.votes} votes</span>,
                  }))}
                  empty="No ratings yet."
                />
              </Card>
              <Card title="Most rated">
                <BarList items={mostRated.map(([id, s]) => ({ key: id, label: name(id), value: s.votes }))} empty="No ratings yet." />
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Latest ratings">
                {data.recent.length ? (
                  <ul className="flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
                    {data.recent.slice(0, 15).map((r, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-2">
                        <span className="min-w-0 truncate">{name(r.tool_id)} {r.prof && <span className="text-sm d-muted">· {r.prof}</span>}</span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="flex" aria-label={`${r.stars} stars`}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} size={14} className={n <= r.stars ? "fill-[hsl(38_95%_45%)] text-[hsl(38_95%_45%)]" : "text-[hsl(var(--zentia-line))]"} />
                            ))}
                          </span>
                          <span className="w-16 text-right text-xs d-muted">{ago(r.updated_at)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="d-empty">No ratings yet.</p>
                )}
              </Card>
              <Card title="Tonight's best picks" action={<span className="text-sm d-muted">Refreshed at midnight</span>}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...picksBy.entries()].slice(0, 13).map(([prof, ps]) => (
                    <div key={prof} className="rounded-xl bg-[hsl(var(--zentia-surface))] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide d-muted">{prof}</p>
                      <p className="mt-1 text-sm">{ps.slice(0, 3).map((p) => name(p.tool_id)).join(", ")}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );
      })()}
    </Page>
  );
}
