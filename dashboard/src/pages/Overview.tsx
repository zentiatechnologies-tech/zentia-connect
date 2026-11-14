import { Link } from "react-router-dom";
import { ArrowRight, Video } from "lucide-react";
import { db, rows, rpc, type Booking, type Digest, type Lead, type Traffic } from "@d/lib/db";
import { ago, dateTime, duration, kindLabels, num, pct, topicLabels } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { RangePicker, useRange } from "@d/Shell";
import { Card, ErrorNote, Insights, Kpi, Loading, Page } from "@d/ui";
import VisitorsChart from "@d/components/VisitorsChart";

export default function Overview() {
  const { range } = useRange();
  const { data, error, loading, reload } = useData(async () => {
    const [cur, prev, digest, leads, upcoming] = await Promise.all([
      rpc<Traffic>("dash_traffic", { p_from: range.from, p_to: range.to }),
      rpc<Traffic>("dash_traffic", { p_from: range.prevFrom, p_to: range.prevTo }),
      rpc<Digest>("dash_digest", { p_period: range.days <= 7 ? "weekly" : "monthly" }),
      rows<Lead>(db.from("leads").select("*").order("created_at", { ascending: false }).limit(6)),
      rows<Booking>(
        db.from("bookings").select("*").eq("status", "booked").gte("start_at", new Date().toISOString()).order("start_at").limit(5),
      ),
    ]);
    return { cur, prev, digest, leads, upcoming };
  }, [range.from]);

  return (
    <Page title="Overview" sub="How the website is doing and who wants to talk to you." actions={<RangePicker />}>
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && <Body {...data} />}
    </Page>
  );
}

function Body({ cur, prev, digest, leads, upcoming }: { cur: Traffic; prev: Traffic; digest: Digest; leads: Lead[]; upcoming: Booking[] }) {
  const t = cur.totals;
  const p = prev.totals;
  const funnel = [
    { label: "Visitors", value: t.visitors },
    { label: "Opened booking form", value: t.book_opens },
    { label: "Sent their details", value: t.book_details },
    { label: "Picked a time", value: t.book_done },
  ];
  const top = Math.max(funnel[0].value, 1);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 2xl:grid-cols-6">
        <Kpi label="Visitors" value={num(t.visitors)} cur={t.visitors} prev={p.visitors} />
        <Kpi label="New leads" value={num(t.leads)} cur={t.leads} prev={p.leads} />
        <Kpi label="Calls booked" value={num(t.bookings)} cur={t.bookings} prev={p.bookings} />
        <Kpi label="Conversion rate" value={pct(t.conversion_rate, 1)} cur={t.conversion_rate} prev={p.conversion_rate} hint="Visits that sent a booking, consult or workshop request" />
        <Kpi label="Avg. visit" value={duration(t.avg_session_s)} cur={t.avg_session_s} prev={p.avg_session_s} />
        <Kpi label="WhatsApp clicks" value={num(t.whatsapp_clicks)} cur={t.whatsapp_clicks} prev={p.whatsapp_clicks} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Visitors per day" action={<span className="text-sm d-muted">Dashed lines mark site changes</span>}>
          <VisitorsChart t={cur} />
        </Card>
        <Card title="Booking funnel">
          <ol className="flex flex-col gap-3">
            {funnel.map((f, i) => (
              <li key={f.label}>
                <div className="flex justify-between text-[0.95rem]">
                  <span>{f.label}</span>
                  <span className="font-semibold tabular-nums">
                    {num(f.value)}
                    {i > 0 && funnel[i - 1].value > 0 && (
                      <span className="ml-2 text-xs font-medium d-muted">{Math.round((f.value / funnel[i - 1].value) * 100)}%</span>
                    )}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[hsl(var(--zentia-surface))]">
                  <div className="h-full rounded-full bg-[hsl(var(--zentia-green))]" style={{ width: `${(f.value / top) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm d-muted">The percentage is how many moved on from the step before.</p>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="What to look at" className="xl:col-span-1" action={<Link to="/reports" className="text-sm d-link">Reports</Link>}>
          <p className="mb-3 text-sm d-muted">{digest.period === "weekly" ? "Last 7 full days" : digest.label}</p>
          <Insights items={digest.insights} />
        </Card>

        <Card title="Latest leads" action={<Link to="/leads" className="inline-flex items-center gap-1 text-sm d-link">All leads <ArrowRight size={14} /></Link>}>
          {leads.length ? (
            <ul className="flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
              {leads.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.name}{l.company ? ` · ${l.company}` : ""}</p>
                    <p className="truncate text-sm d-muted">{kindLabels[l.kind]}{l.topic ? ` · ${topicLabels[l.topic] ?? l.topic}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-xs d-muted">{ago(l.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="d-empty">No leads yet. They'll appear here the moment someone books or asks for help.</p>
          )}
        </Card>

        <Card title="Upcoming calls" action={<Link to="/bookings" className="text-sm d-link">Bookings</Link>}>
          {upcoming.length ? (
            <ul className="flex flex-col gap-2.5">
              {upcoming.map((b) => (
                <li key={b.id} className="d-insight items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{b.attendee_name ?? b.attendee_email}</p>
                    <p className="text-sm d-muted">{dateTime(b.start_at)}</p>
                  </div>
                  {b.meeting_url?.startsWith("http") && (
                    <a href={b.meeting_url} target="_blank" rel="noopener noreferrer" className="d-btn d-btn-ghost d-btn-sm shrink-0">
                      <Video size={16} /> Join
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="d-empty">No calls booked yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
