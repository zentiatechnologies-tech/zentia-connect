import { CircleCheck, CircleDashed, ExternalLink } from "lucide-react";
import { db, rows, SITE } from "@d/lib/db";
import { ago } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { useAuth } from "@d/auth";
import { Card, ErrorNote, Loading, Page } from "@d/ui";

type Admin = { user_id: string; email: string; added_at: string };

async function latest(table: string, col: string) {
  const { data } = await db.from(table).select(col).order(col, { ascending: false }).limit(1);
  return (data?.[0] as unknown as Record<string, string> | undefined)?.[col] ?? null;
}

export default function Settings() {
  const { email, session } = useAuth();
  const { data, error, loading, reload } = useData(async () => {
    const [admins, lastEvent, lastBooking, lastAudit, lastGsc, lastDeploy] = await Promise.all([
      rows<Admin>(db.from("admin_users").select("*").order("added_at")),
      latest("analytics_events", "at"),
      latest("bookings", "created_at"),
      latest("page_audits", "run_at"),
      latest("gsc_daily", "day"),
      latest("site_changes", "at"),
    ]);
    return { admins, lastEvent, lastBooking, lastAudit, lastGsc, lastDeploy };
  }, []);

  const checks = data
    ? [
        { ok: Boolean(data.lastEvent), label: "Visitor tracking", detail: data.lastEvent ? `Last visit recorded ${ago(data.lastEvent)}` : "Waiting for the first visit after the website update." },
        { ok: Boolean(data.lastBooking), label: "Cal.com bookings", detail: data.lastBooking ? `Last booking ${ago(data.lastBooking)}` : "Connect Cal.com and its webhook so booked calls appear here." },
        { ok: Boolean(data.lastAudit), label: "Page health checks", detail: data.lastAudit ? `Last check ${ago(data.lastAudit)}` : "Runs on each website update once the GitHub secret is added." },
        { ok: Boolean(data.lastDeploy), label: "Change log", detail: data.lastDeploy ? `Last entry ${ago(data.lastDeploy)}` : "Website updates are logged once the GitHub secret is added." },
        { ok: Boolean(data.lastGsc), label: "Google Search Console", detail: data.lastGsc ? `Data up to ${data.lastGsc}` : "Verify zentiaai.com in Search Console, then connect it in n8n." },
      ]
    : [];

  return (
    <Page title="Settings" sub="What's connected, who has access, and how to keep your own visits out of the numbers.">
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Setup checklist">
            <ul className="flex flex-col gap-3">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-3">
                  {c.ok ? <CircleCheck size={22} className="shrink-0 text-[hsl(var(--zentia-green-ink))]" /> : <CircleDashed size={22} className="shrink-0 d-muted" />}
                  <div>
                    <p className="font-semibold">{c.label}</p>
                    <p className="text-sm d-muted">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Leave your own visits out">
            <p className="d-muted">
              Open this link once on every phone and computer you use to look at the website. Visits from that browser
              are then not counted.
            </p>
            <a className="d-btn d-btn-primary mt-4" href={`${SITE}/?notrack=1`} target="_blank" rel="noopener noreferrer">
              Stop counting this browser <ExternalLink size={16} />
            </a>
            <p className="mt-3 text-sm d-muted">
              To start counting again, open <code>{SITE}/?notrack=0</code>.
            </p>
          </Card>

          <Card title="People with access">
            <ul className="flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
              {data.admins.map((a) => (
                <li key={a.user_id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="font-semibold">{a.email}</span>
                  <span className="text-sm d-muted">{a.user_id === session.user.id ? "You" : `Added ${ago(a.added_at)}`}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm d-muted">
              To add someone, ask them to create an account on this page. They'll see an account ID to send you; it is
              then added in Supabase (see DASHBOARD.md in the website code).
            </p>
          </Card>

          <Card title="Your account">
            <p>Signed in as <strong>{email}</strong>.</p>
            <button
              type="button"
              className="d-btn d-btn-ghost mt-4"
              onClick={async () => {
                const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
                alert(error ? error.message : "A password reset link is on its way to your inbox.");
              }}
            >
              Change password
            </button>
          </Card>
        </div>
      )}
    </Page>
  );
}
