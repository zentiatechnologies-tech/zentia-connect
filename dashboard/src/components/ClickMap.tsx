import { useEffect, useRef, useState } from "react";
import { rpc, SITE } from "@d/lib/db";
import { useData } from "@d/lib/useData";
import type { Range } from "@d/Shell";

type Click = { x: number; y: number; label: string | null; device: string | null };
const WIDTH = 1280;

/** The real page in a frame, with a dot wherever desktop visitors clicked. */
export default function ClickMap({ paths, range }: { paths: string[]; range: Range }) {
  const [path, setPath] = useState(paths[0] ?? "/");
  const [scale, setScale] = useState(0.5);
  const box = useRef<HTMLDivElement>(null);
  const { data } = useData(
    () => rpc<Click[]>("dash_click_map", { p_path: path, p_from: range.from, p_to: range.to }),
    [path, range.from],
  );

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const desktop = (data ?? []).filter((c) => c.device === "desktop");
  const height = Math.min(Math.max(1600, ...desktop.map((c) => c.y + 600)), 9000);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <select className="d-select w-auto min-w-[200px]" value={path} onChange={(e) => setPath(e.target.value)} aria-label="Page">
          {paths.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="text-sm d-muted">
          {desktop.length} desktop clicks{data && data.length > desktop.length ? ` (${data.length - desktop.length} on phones and tablets not shown)` : ""}
        </span>
      </div>
      <div ref={box} className="relative max-h-[640px] overflow-y-auto overflow-x-hidden rounded-2xl border border-[hsl(var(--zentia-line))] bg-[hsl(var(--zentia-surface))]">
        <div style={{ height: height * scale }} className="relative">
          <iframe
            title={`Page ${path}`}
            src={`${SITE}${path}?notrack=1`}
            width={WIDTH}
            height={height}
            scrolling="no"
            tabIndex={-1}
            className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
            style={{ transform: `scale(${scale})` }}
          />
          {desktop.map((c, i) => (
            <span
              key={i}
              title={c.label ?? undefined}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: c.x * WIDTH * scale,
                top: c.y * scale,
                background: "hsl(14 95% 55% / 0.45)",
                boxShadow: "0 0 0 2px hsl(14 95% 55% / 0.25)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
