import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Traffic } from "@d/lib/db";
import { dayLabel, num } from "@d/lib/format";

const GREEN = "hsl(160 99% 39%)";
const NAVY = "hsl(207 55% 17%)";

/** Daily visitors and page views, with a marker on each day the site changed. */
export default function VisitorsChart({ t, height = 260 }: { t: Traffic; height?: number }) {
  const data = t.daily.map((d) => ({ ...d, label: dayLabel(d.day) }));
  const changeDays = new Map<string, string[]>();
  for (const c of t.changes) {
    const day = new Date(new Date(c.at).getTime() + 3 * 3600000).toISOString().slice(0, 10);
    const label = dayLabel(day);
    changeDays.set(label, [...(changeDays.get(label) ?? []), c.title]);
  }
  return (
    <div style={{ height }} role="img" aria-label="Visitors per day">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="vis" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(207 30% 92%)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(210 18% 40%)" }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(210 18% 40%)" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 14, border: "1px solid hsl(207 30% 88%)", fontFamily: "Outfit" }}
            formatter={(v: number, k: string) => [num(v), k === "visitors" ? "Visitors" : "Page views"]}
            labelFormatter={(l: string) => (changeDays.has(l) ? `${l} · changed: ${changeDays.get(l)!.join("; ")}` : l)}
          />
          {[...changeDays.keys()].map((l) => (
            <ReferenceLine key={l} x={l} stroke={NAVY} strokeDasharray="4 4" strokeOpacity={0.5} />
          ))}
          <Area type="monotone" dataKey="pageviews" stroke={NAVY} strokeOpacity={0.35} fill="none" strokeWidth={1.5} isAnimationActive={false} />
          <Area type="monotone" dataKey="visitors" stroke={GREEN} fill="url(#vis)" strokeWidth={2.5} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
