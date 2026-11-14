import { useState } from "react";
import { Mail } from "lucide-react";
import { rpc, type Digest, type Totals } from "@d/lib/db";
import { dateTime, duration, kindLabels, num, pct, topicLabels } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { BarList, Card, Delta, ErrorNote, Insights, Loading, Page, Seg } from "@d/ui";

type Period = Digest["period"];
const rowsFor: { key: keyof Totals; label: string; fmt: (n: number | null) => string; invert?: boolean }[] = [
  { key: "visitors", label: "Visitors", fmt: num },
  { key: "pageviews", label: "Page views", fmt: num },
  { key: "leads", label: "New leads", fmt: num },
  { key: "bookings", label: "Calls booked", fmt: num },
  { key: "conversion_rate", label: "Conversion rate", fmt: (n) => pct(n, 1) },
  { key: "bounce_rate", label: "Left after one page", fmt: (n) => pct(n), invert: true },
  { key: "avg_session_s", label: "Average visit", fmt: duration },
  { key: "whatsapp_clicks", label: "WhatsApp clicks", fmt: num },
  { key: "hub_ratings", label: "Tool Hub ratings", fmt: num },
];
const schedule: Record<Period, string> = {
  daily: "Emailed every morning at 7:00 for the day before.",
  weekly: "Emailed every Monday at 7:00 for the last 7 days.",
  monthly: "Emailed on the 1st at 7:00 for the month before.",
};

export default function Reports() {
  const [period, setPeriod] = useState<Period>("weekly");
  const { data, error, loading, reload } = useData(() => rpc<Digest>("dash_digest", { p_period: period }), [period]);

  return (
    <Page
      title="Reports"
      sub="The same reports that are emailed to you, with suggestions on what to do next."
      actions={
        <Seg<Period>
          label="Report"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      }
    >
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className={`flex flex-col gap-5 ${loading ? "opacity-60" : ""}`}>
          <div className="d-card-dark flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/70">{period[0].toUpperCase() + period.slice(1)} report</p>
              <h2 className="font-heading text-2xl font-bold">{data.label}</h2>
            </div>
            <p className="flex items-center gap-2 text-sm text-white/75"><Mail size={16} /> {schedule[period]}</p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Card title="Insights and suggestions">
              <Insights items={data.insights} />
            </Card>
            <Card title="Numbers">
              <table className="d-table">
                <thead><tr><th>Measure</th><th className="num">This period</th><th className="num">Before</th><th className="num">Change</th></tr></thead>
                <tbody>
                  {rowsFor.map((r) => (
                    <tr key={r.key}>
                      <td>{r.label}</td>
                      <td className="num font-semibold">{r.fmt(data.totals[r.key] as number | null)}</td>
                      <td className="num d-muted">{r.fmt(data.previous[r.key] as number | null)}</td>
                      <td className="num"><Delta cur={data.totals[r.key] as number | null} prev={data.previous[r.key] as number | null} invert={r.invert} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Top pages"><BarList items={data.top_pages.map((p) => ({ key: p.path, label: p.path, value: p.views }))} empty="No visits." /></Card>
            <Card title="Top sources"><BarList items={data.top_sources.map((s) => ({ key: s.source, label: s.source, value: s.sessions }))} empty="No visits." /></Card>
            <Card title="Countries"><BarList items={data.countries.map((c) => ({ key: c.country, label: c.country, value: c.visitors }))} empty="No visits." /></Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title={`New leads (${data.leads.length})`}>
              {data.leads.length ? (
                <ul className="flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
                  {data.leads.map((l, i) => (
                    <li key={i} className="py-2.5">
                      <p className="font-semibold">{l.name}{l.company ? ` · ${l.company}` : ""}</p>
                      <p className="text-sm d-muted">{kindLabels[l.kind]}{l.topic ? ` · ${topicLabels[l.topic] ?? l.topic}` : ""} · {l.contact} · {dateTime(l.at)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="d-empty">No new leads in this period.</p>
              )}
            </Card>
            <Card title="Calls in the next 7 days">
              {data.upcoming.length ? (
                <ul className="flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
                  {data.upcoming.map((u, i) => (
                    <li key={i} className="flex justify-between gap-3 py-2.5"><span className="font-semibold">{u.name}</span><span className="d-muted">{dateTime(u.start_at)}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="d-empty">No calls booked for the coming week.</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </Page>
  );
}
