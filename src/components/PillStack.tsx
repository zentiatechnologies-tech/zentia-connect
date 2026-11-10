/** Brand artwork: a fan of glowing glass panels in Zentia navy and green.
 *  Drawn in SVG so it stays sharp at any size and costs almost nothing to load. */
const panels = [
  { inset: 0, fill: "url(#ps-navy)", stroke: "hsl(200 60% 55% / 0.45)" },
  { inset: 1, fill: "url(#ps-teal)", stroke: "hsl(170 50% 75% / 0.6)" },
  { inset: 2, fill: "url(#ps-green)", stroke: "hsl(160 99% 62%)" },
  { inset: 3, fill: "url(#ps-mint)", stroke: "hsl(160 80% 80% / 0.9)" },
  { inset: 4, fill: "url(#ps-grey)", stroke: "hsl(0 0% 100% / 0.85)" },
  { inset: 5, fill: "url(#ps-white)", stroke: "hsl(0 0% 100%)" },
];

export default function PillStack({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 900 1000"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ps-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(207 60% 22%)" stopOpacity="0.9" />
          <stop offset="1" stopColor="hsl(190 55% 24%)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="ps-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(190 30% 34%)" />
          <stop offset="1" stopColor="hsl(170 45% 30%)" />
        </linearGradient>
        <linearGradient id="ps-green" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="hsl(160 99% 42%)" />
          <stop offset="1" stopColor="hsl(165 90% 30%)" />
        </linearGradient>
        <linearGradient id="ps-mint" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="hsl(165 45% 50%)" />
          <stop offset="1" stopColor="hsl(175 35% 40%)" />
        </linearGradient>
        <linearGradient id="ps-grey" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="hsl(200 12% 58%)" />
          <stop offset="1" stopColor="hsl(170 20% 62%)" />
        </linearGradient>
        <linearGradient id="ps-white" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="hsl(160 60% 92%)" />
          <stop offset="1" stopColor="hsl(160 40% 80%)" />
        </linearGradient>
        <filter id="ps-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g transform="rotate(16 700 700)">
        {panels.map((p) => {
          const x = 150 + p.inset * 135;
          const y = 40 + p.inset * 150;
          return (
            <g key={p.inset}>
              <rect x={x} y={y} width={1100} height={1500} rx={120} fill="none" stroke={p.stroke} strokeWidth={6} filter="url(#ps-glow)" opacity={0.6} />
              <rect x={x} y={y} width={1100} height={1500} rx={120} fill={p.fill} stroke={p.stroke} strokeWidth={2.5} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
