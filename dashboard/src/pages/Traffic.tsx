import { useState } from "react";
import { Copy } from "lucide-react";
import { rpc, SITE, type Traffic as T } from "@d/lib/db";
import { duration, eventLabels, num, pct } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { RangePicker, useRange } from "@d/Shell";
import { BarList, Card, ErrorNote, Kpi, Loading, Page } from "@d/ui";
import VisitorsChart from "@d/components/VisitorsChart";
import ClickMap from "@d/components/ClickMap";

const flag = (code: string) =>
  code && code.length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "🌐";

export default function Traffic() {
  const { range } = useRange();
  const { data, error, loading, reload } = useData(async () => {
    const [cur, prev] = await Promise.all([
      rpc<T>("dash_traffic", { p_from: range.from, p_to: range.to }),
      rpc<T>("dash_traffic", { p_from: range.prevFrom, p_to: range.prevTo }),
    ]);
    return { cur, prev };
  }, [range.from]);

  return (
    <Page title="Traffic" sub="Who visits, where they come from and what they do. Your own visits are excluded once you open the opt-out link in Settings." actions={<RangePicker />}>
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && <Body cur={data.cur} prev={data.prev} />}
    </Page>
  );
}

function Body({ cur, prev }: { cur: T; prev: T }) {
  const { range } = useRange();
  const t = cur.totals;
  const p = prev.totals;
  const events = Object.entries(cur.events).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Kpi label="Page views" value={num(t.pageviews)} cur={t.pageviews} prev={p.pageviews} />
        <Kpi label="Visits" value={num(t.sessions)} cur={t.sessions} prev={p.sessions} />
        <Kpi label="Left after one page" value={pct(t.bounce_rate)} cur={t.bounce_rate} prev={p.bounce_rate} invert />
        <Kpi label="On phones" value={pct(t.mobile_share)} />
      </div>

      <Card title="Visitors per day">
        <VisitorsChart t={cur} height={300} />
      </Card>

      <Card title="Pages">
        {cur.pages.length ? (
          <div className="d-scroll">
            <table className="d-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Page</th>
                  <th className="num">Views</th>
                  <th className="num">Visitors</th>
                  <th className="num">Avg. time</th>
                  <th className="num">Read</th>
                  <th className="num">Landed here</th>
                  <th className="num">Left at once</th>
                </tr>
              </thead>
              <tbody>
                {cur.pages.map((r) => (
                  <tr key={r.path}>
                    <td><a className="d-link font-medium" href={SITE + r.path} target="_blank" rel="noopener noreferrer">{r.path}</a></td>
                    <td className="num">{num(r.views)}</td>
                    <td className="num">{num(r.visitors)}</td>
                    <td className="num">{duration(r.avg_time_s)}</td>
                    <td className="num" title="Average scroll depth">{pct(r.avg_scroll)}</td>
                    <td className="num">{num(r.entries)}</td>
                    <td className="num">{r.entries ? pct((r.bounces / r.entries) * 100) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="d-empty">No page views in this period yet.</p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Where visitors come from">
          <BarList
            items={cur.referrers.map((r) => ({
              key: r.source,
              label: r.source,
              value: r.sessions,
              extra: r.conversions ? <span className="d-badge d-badge-green">{r.conversions} leads</span> : null,
            }))}
            empty="No visits yet."
          />
        </Card>
        <Card title="Countries">
          <BarList
            items={cur.countries.map((c) => ({ key: c.country, label: `${flag(c.code)}  ${c.country}`, value: c.visitors }))}
            empty="No visits yet."
          />
          <p className="mt-3 text-xs d-muted">Worked out from each visitor's time zone, so no personal data is stored.</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Most clicked">
          <BarList
            items={cur.clicks.slice(0, 12).map((c, i) => ({
              key: String(i),
              label: (
                <span>
                  {c.label || c.href || "(no label)"} <span className="text-sm d-muted">on {c.path}</span>
                </span>
              ),
              value: c.clicks,
            }))}
            empty="No clicks yet."
          />
        </Card>
        <Card title="Actions taken">
          <BarList items={events.map(([k, v]) => ({ key: k, label: eventLabels[k] ?? k, value: v }))} empty="No actions yet." />
          <div className="mt-4">
            <BarList items={cur.devices.map((d) => ({ key: d.device, label: d.device[0].toUpperCase() + d.device.slice(1), value: d.sessions }))} empty="" />
          </div>
        </Card>
      </div>

      <Card title="Campaigns" action={<span className="text-sm d-muted">Visits from tracked links</span>}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <BarList
            items={cur.campaigns.map((c, i) => ({
              key: String(i),
              label: `${c.source}${c.campaign ? ` / ${c.campaign}` : ""}${c.medium ? ` (${c.medium})` : ""}`,
              value: c.sessions,
              extra: c.conversions ? <span className="d-badge d-badge-green">{c.conversions} leads</span> : null,
            }))}
            empty="No tracked links used yet. Make one on the right and use it in your next post."
          />
          <LinkBuilder />
        </div>
      </Card>

      <Card title="Click map" action={<span className="text-sm d-muted">Where desktop visitors clicked</span>}>
        <ClickMap paths={cur.pages.length ? cur.pages.map((r) => r.path) : ["/"]} range={range} />
      </Card>
    </div>
  );
}

function LinkBuilder() {
  const [page, setPage] = useState("/");
  const [source, setSource] = useState("linkedin");
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState(false);
  const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const medium = ["whatsapp", "email"].includes(source) ? source === "email" ? "email" : "message" : "social";
  const url = `${SITE}${page}?utm_source=${slug(source)}&utm_medium=${medium}${campaign ? `&utm_campaign=${slug(campaign)}` : ""}`;

  return (
    <div className="rounded-2xl bg-[hsl(var(--zentia-surface))] p-4">
      <h3 className="font-heading font-bold">Make a tracked link</h3>
      <p className="mt-1 text-sm d-muted">Share this instead of the plain address to see exactly which post brought visitors and leads.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="d-label">
          Page
          <select className="d-select" value={page} onChange={(e) => setPage(e.target.value)}>
            <option value="/">Home</option>
            <option value="/tools/">Tool Hub</option>
            <option value="/about/">About</option>
            <option value="/resources/">Resources</option>
          </select>
        </label>
        <label className="d-label">
          Where you'll post it
          <select className="d-select" value={source} onChange={(e) => setSource(e.target.value)}>
            {["linkedin", "whatsapp", "facebook", "instagram", "x", "email", "event"].map((s) => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </label>
        <label className="d-label">
          Campaign name
          <input className="d-input" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. december-offer" />
        </label>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input className="d-input font-mono text-sm" readOnly value={url} aria-label="Tracked link" onFocus={(e) => e.target.select()} />
        <button
          type="button"
          className="d-btn d-btn-primary shrink-0"
          onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
        >
          <Copy size={16} /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
