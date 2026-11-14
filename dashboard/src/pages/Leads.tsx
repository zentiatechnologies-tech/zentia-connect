import { useMemo, useState } from "react";
import { Download, Mail, MessageCircle, Phone } from "lucide-react";
import { db, rows, type Lead, type LeadStatus } from "@d/lib/db";
import { ago, csv, dateTime, download, kindLabels, num, statusLabels, topicLabels, ugx, waLink } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { Card, ErrorNote, Loading, Page } from "@d/ui";

const statuses = Object.keys(statusLabels) as LeadStatus[];
const statusTone: Record<LeadStatus, string> = {
  new: "d-badge-navy",
  contacted: "",
  booked: "d-badge-green",
  qualified: "d-badge-green",
  won: "d-badge-green",
  lost: "d-badge-bad",
};

export default function Leads() {
  const { data, error, loading, reload, setData } = useData(
    () => rows<Lead>(db.from("leads").select("*").order("created_at", { ascending: false }).limit(1000)),
    [],
  );
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [kind, setKind] = useState<string>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length ?? 0 };
    for (const l of data ?? []) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [data]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter(
      (l) =>
        (status === "all" || l.status === status) &&
        (kind === "all" || l.kind === kind) &&
        (!term || [l.name, l.company, l.email, l.contact, l.message].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [data, status, kind, q]);

  const won = (data ?? []).filter((l) => l.status === "won").reduce((s, l) => s + (l.value_ugx ?? 0), 0);
  const open = (data ?? [])
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + (l.value_ugx ?? 0), 0);

  const update = async (id: number, patch: Partial<Lead>) => {
    const full = { ...patch, updated_at: new Date().toISOString() };
    setData((cur) => cur?.map((l) => (l.id === id ? { ...l, ...full } : l)) ?? cur);
    const { error } = await db.from("leads").update(full).eq("id", id);
    if (error) {
      alert(`Couldn't save: ${error.message}`);
      reload();
    }
  };

  const exportCsv = () =>
    download(
      `zentia-leads-${new Date().toISOString().slice(0, 10)}.csv`,
      csv(
        shown.map((l) => ({
          created: l.created_at,
          type: kindLabels[l.kind],
          status: statusLabels[l.status],
          name: l.name,
          company: l.company,
          email: l.email,
          contact: l.contact,
          interested_in: l.topic ? topicLabels[l.topic] ?? l.topic : "",
          message: l.message,
          value_ugx: l.value_ugx,
          notes: l.notes,
          source: l.source?.utm_source || l.source?.referrer || "direct",
          campaign: l.source?.utm_campaign,
        })),
      ),
    );

  return (
    <Page
      title="Leads"
      sub="Everyone who booked a call, asked for a Tool Hub consult or a workshop."
      actions={
        <button type="button" className="d-btn d-btn-ghost" onClick={exportCsv} disabled={!shown.length}>
          <Download size={18} /> Export CSV
        </button>
      }
    >
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="d-card"><div className="d-kpi-label">All leads</div><div className="d-kpi-value">{num(data.length)}</div></div>
            <div className="d-card"><div className="d-kpi-label">Waiting for a reply</div><div className="d-kpi-value">{num(counts.new ?? 0)}</div></div>
            <div className="d-card"><div className="d-kpi-label">Open pipeline</div><div className="d-kpi-value text-[1.5rem]">{ugx(open)}</div></div>
            <div className="d-card"><div className="d-kpi-label">Won</div><div className="d-kpi-value text-[1.5rem]">{ugx(won)}</div></div>
          </div>

          <Card>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                {(["all", ...statuses] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={status === s}
                    onClick={() => setStatus(s)}
                    className={`d-btn d-btn-sm ${status === s ? "bg-[hsl(var(--zentia-navy))] text-white" : "d-btn-ghost"}`}
                  >
                    {s === "all" ? "All" : statusLabels[s]} <span className="opacity-70">{counts[s] ?? 0}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select className="d-select sm:w-48" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type">
                  <option value="all">All types</option>
                  {Object.entries(kindLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input className="d-input sm:w-64" type="search" placeholder="Search name, company, email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leads" />
              </div>
            </div>

            {shown.length ? (
              <ul className="mt-5 flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
                {shown.map((l) => (
                  <LeadRow key={l.id} lead={l} open={openId === l.id} toggle={() => setOpenId(openId === l.id ? null : l.id)} update={update} />
                ))}
              </ul>
            ) : (
              <p className="d-empty mt-5">{data.length ? "No leads match these filters." : "No leads yet. Bookings, Tool Hub consults and workshop requests land here."}</p>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}

function LeadRow({ lead: l, open, toggle, update }: { lead: Lead; open: boolean; toggle: () => void; update: (id: number, p: Partial<Lead>) => void }) {
  const [notes, setNotes] = useState(l.notes ?? "");
  const [value, setValue] = useState(l.value_ugx?.toString() ?? "");
  const phone = l.contact && !l.contact.includes("@") ? l.contact : null;
  const wa = phone ? waLink(phone) : null;
  const source = l.source?.utm_source
    ? `${l.source.utm_source}${l.source.utm_campaign ? ` / ${l.source.utm_campaign}` : ""}`
    : l.source?.referrer || (l.source?.page ? "Direct" : "–");

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" onClick={toggle} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-semibold">
            {l.name}
            {l.company && <span className="font-normal d-muted"> · {l.company}</span>}
          </span>
          <span className="block truncate text-sm d-muted">
            {kindLabels[l.kind]}
            {l.topic && ` · ${topicLabels[l.topic] ?? l.topic}`} · {ago(l.created_at)} · from {source}
          </span>
        </button>
        <span className={`d-badge ${statusTone[l.status]}`}>{statusLabels[l.status]}</span>
        <select
          className="d-select !h-9 w-40 text-sm"
          value={l.status}
          onChange={(e) => update(l.id, { status: e.target.value as LeadStatus })}
          aria-label={`Status for ${l.name}`}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>

      {open && (
        <div className="mt-4 grid gap-5 rounded-2xl bg-[hsl(var(--zentia-surface))] p-4 md:grid-cols-2 md:p-5">
          <div className="flex flex-col gap-3 text-[0.95rem]">
            <div className="flex flex-wrap gap-2">
              {l.email && (
                <a className="d-btn d-btn-ghost d-btn-sm" href={`mailto:${l.email}?subject=${encodeURIComponent("Your call with Zentia")}`}>
                  <Mail size={16} /> {l.email}
                </a>
              )}
              {wa && (
                <a className="d-btn d-btn-ghost d-btn-sm" href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              )}
              {phone && (
                <a className="d-btn d-btn-ghost d-btn-sm" href={`tel:${phone.replace(/\s/g, "")}`}>
                  <Phone size={16} /> {phone}
                </a>
              )}
            </div>
            <p className="d-muted">Received {dateTime(l.created_at)}</p>
            {l.message && <p className="whitespace-pre-wrap rounded-xl bg-white p-3">{l.message}</p>}
            {l.toolkit?.length > 0 && <p><span className="font-semibold">Tool Hub shortlist:</span> {l.toolkit.join(", ")}</p>}
            {l.prof && <p><span className="font-semibold">Industry:</span> {l.prof}</p>}
            <p className="text-sm d-muted">
              Landed on {l.source?.landing ?? "–"}, sent from {l.source?.page ?? "–"}
              {l.source?.referrer ? `, referred by ${l.source.referrer}` : ""}.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <label className="d-label">
              Deal value (UGX)
              <input className="d-input" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => update(l.id, { value_ugx: value ? Number(value) : null })} placeholder="e.g. 1500000" />
            </label>
            <label className="d-label">
              Notes
              <textarea className="d-textarea" rows={4} value={notes} maxLength={5000} onChange={(e) => setNotes(e.target.value)} placeholder="What you discussed, next step, follow-up date" />
            </label>
            <button type="button" className="d-btn d-btn-primary d-btn-sm self-start" onClick={() => update(l.id, { notes: notes || null })}>
              Save notes
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
