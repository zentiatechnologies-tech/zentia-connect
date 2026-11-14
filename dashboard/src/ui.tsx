import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleAlert, CircleCheck, Info, Lightbulb, Minus } from "lucide-react";
import { change, num } from "@d/lib/format";
import type { Insight } from "@d/lib/db";

export function Page({ title, sub, actions, children }: { title: string; sub?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="d-top">
        <div>
          <h1 className="d-h1">{title}</h1>
          {sub && <p className="d-sub">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      {children}
    </>
  );
}

export function Card({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`d-card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="d-h2">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Delta({ cur, prev, invert = false }: { cur: number | null; prev: number | null; invert?: boolean }) {
  const c = change(cur, prev);
  if (c == null) return <span className="d-delta d-delta-flat">new</span>;
  const good = invert ? c < 0 : c > 0;
  const cls = c === 0 ? "d-delta-flat" : good ? "d-delta-up" : "d-delta-down";
  const Icon = c === 0 ? Minus : c > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`d-delta ${cls}`} title="Change on the previous period">
      <Icon size={13} aria-hidden="true" />
      {c > 0 ? "+" : ""}
      {c}%
    </span>
  );
}

export function Kpi({
  label,
  value,
  cur,
  prev,
  invert,
  hint,
}: {
  label: string;
  value: ReactNode;
  cur?: number | null;
  prev?: number | null;
  invert?: boolean;
  hint?: string;
}) {
  return (
    <div className="d-card" title={hint}>
      <div className="d-kpi-label">{label}</div>
      <div className="d-kpi-value">{value}</div>
      {cur !== undefined && (
        <div className="mt-3 flex items-center gap-2 whitespace-nowrap text-xs d-muted">
          <Delta cur={cur ?? null} prev={prev ?? null} invert={invert} />
          <span>vs previous</span>
        </div>
      )}
    </div>
  );
}

export function BarList({
  items,
  empty = "Nothing yet.",
  format = num,
}: {
  items: { label: ReactNode; value: number; extra?: ReactNode; key?: string }[];
  empty?: string;
  format?: (n: number) => string;
}) {
  if (!items.length) return <p className="d-empty">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((i, n) => (
        <li key={i.key ?? n} className="d-bar">
          <span className="d-bar-fill" style={{ width: `${(i.value / max) * 100}%` }} aria-hidden="true" />
          <span className="relative min-w-0 truncate">{i.label}</span>
          <span className="relative flex shrink-0 items-center gap-2 font-semibold tabular-nums">
            {i.extra}
            {format(i.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

const insightIcon = { good: CircleCheck, warn: CircleAlert, action: Lightbulb, info: Info };

export function Insights({ items }: { items: Insight[] }) {
  if (!items.length) return <p className="d-empty">No insights yet. They appear once visits start coming in.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((i, n) => {
        const Icon = insightIcon[i.tone] ?? Info;
        return (
          <li key={n} className={`d-insight ${i.tone !== "info" ? `d-insight-${i.tone}` : ""}`}>
            <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{i.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="d-card h-28 animate-pulse" />
      ))}
    </div>
  );
}

export function ErrorNote({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="d-card" role="alert">
      <p className="font-semibold">Couldn't load this.</p>
      <p className="mt-1 text-sm d-muted">{error}</p>
      {retry && (
        <button type="button" className="d-btn d-btn-ghost d-btn-sm mt-3" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Seg<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="d-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
