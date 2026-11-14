import { CalendarPlus, Video } from "lucide-react";
import { db, rows, type Booking } from "@d/lib/db";
import { dateTime } from "@d/lib/format";
import { useData } from "@d/lib/useData";
import { Card, ErrorNote, Loading, Page } from "@d/ui";

const tone: Record<Booking["status"], string> = {
  booked: "d-badge-green",
  rescheduled: "",
  cancelled: "d-badge-bad",
  completed: "d-badge-navy",
  no_show: "d-badge-warn",
};
const label: Record<Booking["status"], string> = {
  booked: "Booked",
  rescheduled: "Moved",
  cancelled: "Cancelled",
  completed: "Done",
  no_show: "No-show",
};

export default function Bookings() {
  const { data, error, loading, reload, setData } = useData(
    () => rows<Booking>(db.from("bookings").select("*").order("start_at", { ascending: false }).limit(500)),
    [],
  );

  const now = Date.now();
  const upcoming = (data ?? []).filter((b) => b.status === "booked" && new Date(b.start_at).getTime() >= now - 3600000).reverse();
  const past = (data ?? []).filter((b) => !upcoming.includes(b));

  const mark = async (b: Booking, status: Booking["status"]) => {
    setData((cur) => cur?.map((x) => (x.id === b.id ? { ...x, status } : x)) ?? cur);
    const { error } = await db.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", b.id);
    if (error) {
      alert(`Couldn't save: ${error.message}`);
      reload();
    }
  };

  return (
    <Page title="Bookings" sub="Calls booked through the website calendar. Times are Kampala time.">
      {error && <ErrorNote error={error} retry={reload} />}
      {loading && !data && <Loading />}
      {data && !data.length && (
        <Card>
          <div className="flex flex-col items-start gap-3">
            <CalendarPlus size={36} className="text-[hsl(var(--zentia-green-ink))]" />
            <h2 className="d-h2">No bookings yet</h2>
            <p className="max-w-2xl d-muted">
              Bookings appear here automatically once Cal.com is connected: visitors pick a time in the website pop-up,
              Cal.com adds it to the Zentia Google Calendar and emails both of you, then tells this dashboard. Until then,
              call requests still arrive under Leads.
            </p>
          </div>
        </Card>
      )}
      {data && data.length > 0 && (
        <div className="flex flex-col gap-5">
          <Card title={`Coming up (${upcoming.length})`}>
            {upcoming.length ? <List items={upcoming} mark={mark} /> : <p className="d-empty">Nothing booked ahead.</p>}
          </Card>
          <Card title="Past and cancelled">
            {past.length ? <List items={past} mark={mark} /> : <p className="d-empty">None yet.</p>}
          </Card>
        </div>
      )}
    </Page>
  );
}

function List({ items, mark }: { items: Booking[]; mark: (b: Booking, s: Booking["status"]) => void }) {
  return (
    <ul className="flex flex-col divide-y divide-[hsl(var(--zentia-line))]">
      {items.map((b) => {
        const past = new Date(b.start_at).getTime() < Date.now();
        return (
          <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{b.attendee_name ?? "Unknown"} <span className="font-normal d-muted">{b.attendee_email}</span></p>
              <p className="text-sm d-muted">
                {dateTime(b.start_at)}
                {b.attendee_tz && b.attendee_tz !== "Africa/Kampala" ? ` · they're in ${b.attendee_tz.replace(/_/g, " ")}` : ""}
                {b.notes ? ` · ${b.notes.slice(0, 80)}` : ""}
              </p>
            </div>
            <span className={`d-badge ${tone[b.status]}`}>{label[b.status]}</span>
            {b.meeting_url?.startsWith("http") && b.status === "booked" && (
              <a href={b.meeting_url} target="_blank" rel="noopener noreferrer" className="d-btn d-btn-ghost d-btn-sm">
                <Video size={16} /> Join
              </a>
            )}
            {past && b.status === "booked" && (
              <span className="flex gap-2">
                <button type="button" className="d-btn d-btn-ghost d-btn-sm" onClick={() => mark(b, "completed")}>Mark done</button>
                <button type="button" className="d-btn d-btn-ghost d-btn-sm" onClick={() => mark(b, "no_show")}>No-show</button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
