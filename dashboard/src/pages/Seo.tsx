import { useState, type FormEvent } from "react";
import { CircleAlert, CircleCheck, Trash2 } from "lucide-react";
import { db, rows, SITE } from "@d/lib/db";
import { ago, dateTime, num, pct } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { Card, ErrorNote, Kpi, Loading, Page } from "@d/ui";

type Audit = {
  id: number;
  run_at: string;
  commit_sha: string | null;
  path: string;
  title: string | null;
  description: string | null;
  h1_count: number | null;
  word_count: number | null;
  images: number | null;
  images_no_alt: number | null;
  canonical: string | null;
  issues: string[];
};
type Gsc = { day: string; query: string; page: string; clicks: number; impressions: number; position: number | null };
type Change = { id: number; at: string; kind: string; title: string; detail: string | null; commit_sha: string | null; author: string | null };

const kinds = [
  { id: "note", label: "Note" },
  { id: "campaign", label: "Campaign or post" },
  { id: "content", label: "Content change" },
  { id: "seo", label: "SEO change" },
];

export default function Seo() {
  const since = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
  const { data, error, loading, reload, setData } = useData(async () => {
    const [audits, gsc, changes] = await Promise.all([
      rows<Audit>(db.from("page_audits").select("*").order("run_at", { ascending: false }).limit(400)),
      rows<Gsc>(db.from("gsc_daily").select("*").gte("day", since).limit(20000)),
      rows<Change>(db.from("site_changes").select("*").order("at", { ascending: false }).limit(100)),
    ]);
    return { audits, gsc, changes };
  }, []);

  const removeChange = async (c: Change) => {
    if (!confirm(`Delete "${c.title}"?`)) return;
    setData((cur) => (cur ? { ...cur, changes: cur.changes.filter((x) => x.id !== c.id) } : cur));
    await db.from("site_changes").delete().eq("id", c.id);
  };

  return (
    <Page title="SEO & changes" sub="How the site looks to Google, and a log of what changed and when.">
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="flex flex-col gap-5">
          <SearchConsole rows={data.gsc} />
          <Audits audits={data.audits} />
          <Card title="Change log" action={<span className="text-sm d-muted">Deploys are added automatically</span>}>
            <AddChange onAdded={reload} />
            {data.changes.length ? (
              <ul className="mt-5 flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
                {data.changes.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 py-3">
                    <span className={`d-badge mt-0.5 ${c.kind === "deploy" ? "d-badge-navy" : c.kind === "campaign" ? "d-badge-green" : ""}`}>
                      {c.kind === "deploy" ? "Deploy" : kinds.find((k) => k.id === c.kind)?.label ?? c.kind}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.title}</p>
                      {c.detail && <p className="whitespace-pre-wrap text-sm d-muted">{c.detail}</p>}
                      <p className="text-xs d-muted">
                        {dateTime(c.at)}
                        {c.author ? ` · ${c.author}` : ""}
                        {c.commit_sha ? ` · ${c.commit_sha.slice(0, 7)}` : ""}
                      </p>
                    </div>
                    {c.kind !== "deploy" && (
                      <button type="button" className="d-btn d-btn-sm" aria-label={`Delete ${c.title}`} onClick={() => removeChange(c)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="d-empty mt-5">Nothing logged yet. Every website update is recorded here, and you can add your own notes, like a LinkedIn post or a price change, to see their effect on the Traffic chart.</p>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}

function SearchConsole({ rows: r }: { rows: Gsc[] }) {
  if (!r.length) {
    return (
      <Card title="Google search">
        <p className="d-empty">
          Not connected yet. Once Google Search Console is verified for zentiaai.com, the searches people use to find
          you, your clicks and your average position appear here every morning.
        </p>
      </Card>
    );
  }
  const clicks = r.reduce((s, x) => s + x.clicks, 0);
  const impressions = r.reduce((s, x) => s + x.impressions, 0);
  const weighted = r.reduce((s, x) => s + (x.position ?? 0) * x.impressions, 0);
  const group = (key: "query" | "page") => {
    const m = new Map<string, { clicks: number; impressions: number; pos: number }>();
    for (const x of r) {
      const k = x[key];
      if (!k) continue;
      const g = m.get(k) ?? { clicks: 0, impressions: 0, pos: 0 };
      m.set(k, { clicks: g.clicks + x.clicks, impressions: g.impressions + x.impressions, pos: g.pos + (x.position ?? 0) * x.impressions });
    }
    return [...m.entries()].sort((a, b) => b[1].clicks - a[1].clicks || b[1].impressions - a[1].impressions).slice(0, 15);
  };
  const table = (key: "query" | "page", head: string) => (
    <div className="d-scroll">
      <table className="d-table min-w-[480px]">
        <thead>
          <tr><th>{head}</th><th className="num">Clicks</th><th className="num">Shown</th><th className="num">Avg. position</th></tr>
        </thead>
        <tbody>
          {group(key).map(([k, g]) => (
            <tr key={k}>
              <td className="max-w-[320px] truncate">{key === "page" ? k.replace(SITE, "") || "/" : k}</td>
              <td className="num">{num(g.clicks)}</td>
              <td className="num">{num(g.impressions)}</td>
              <td className="num">{g.impressions ? (g.pos / g.impressions).toFixed(1) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Kpi label="Clicks from Google (28 days)" value={num(clicks)} />
        <Kpi label="Times shown in results" value={num(impressions)} />
        <Kpi label="Click-through rate" value={pct(impressions ? (clicks / impressions) * 100 : null, 1)} />
        <Kpi label="Average position" value={impressions ? (weighted / impressions).toFixed(1) : "–"} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="What people searched">{table("query", "Search")}</Card>
        <Card title="Pages found on Google">{table("page", "Page")}</Card>
      </div>
    </>
  );
}

function Audits({ audits }: { audits: Audit[] }) {
  if (!audits.length) {
    return (
      <Card title="Page health">
        <p className="d-empty">The first check runs on the next website update. Every page's title, description, headings and image descriptions are checked each time the site is published.</p>
      </Card>
    );
  }
  const last = audits[0].run_at;
  const latest = audits.filter((a) => a.run_at === last);
  const bad = latest.filter((a) => a.issues.length);
  return (
    <Card title="Page health" action={<span className="text-sm d-muted">Checked {ago(last)}{latest[0].commit_sha ? ` · ${latest[0].commit_sha.slice(0, 7)}` : ""}</span>}>
      <p className={`mb-4 flex items-center gap-2 font-semibold ${bad.length ? "" : "text-[hsl(var(--zentia-green-ink))]"}`}>
        {bad.length ? <CircleAlert size={20} className="text-[hsl(var(--warn))]" /> : <CircleCheck size={20} />}
        {bad.length ? `${bad.length} of ${latest.length} pages have something to fix` : `All ${latest.length} pages pass`}
      </p>
      <div className="d-scroll">
        <table className="d-table min-w-[720px]">
          <thead>
            <tr><th>Page</th><th>Title</th><th className="num">Description</th><th className="num">H1</th><th className="num">Words</th><th className="num">Images w/o alt</th><th>To fix</th></tr>
          </thead>
          <tbody>
            {latest.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.path}</td>
                <td className="max-w-[260px]"><span className="line-clamp-2">{a.title}</span><span className="text-xs d-muted">{a.title?.length ?? 0} characters</span></td>
                <td className="num">{a.description?.length ?? 0}</td>
                <td className="num">{a.h1_count}</td>
                <td className="num">{num(a.word_count)}</td>
                <td className="num">{a.images_no_alt ?? 0} / {a.images ?? 0}</td>
                <td>
                  {a.issues.length ? (
                    <ul className="list-disc pl-4 text-sm">{a.issues.map((i) => <li key={i}>{i}</li>)}</ul>
                  ) : (
                    <span className="d-badge d-badge-green">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AddChange({ onAdded }: { onAdded: () => void }) {
  const [kind, setKind] = useState("campaign");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: u } = await db.auth.getUser();
    const { error } = await db.from("site_changes").insert({ kind, title: title.trim(), author: u.user?.email ?? null });
    setBusy(false);
    if (error) return alert(error.message);
    setTitle("");
    onAdded();
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl bg-[hsl(var(--zentia-surface))] p-3 sm:flex-row">
      <select className="d-select sm:w-48" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
        {kinds.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
      </select>
      <input className="d-input" required maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Posted the Tool Hub on LinkedIn" aria-label="What happened" />
      <button type="submit" className="d-btn d-btn-primary shrink-0" disabled={busy}>Add to log</button>
    </form>
  );
}
