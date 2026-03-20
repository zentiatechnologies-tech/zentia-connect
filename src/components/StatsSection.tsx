import { useScrollReveal } from "@/hooks/useScrollReveal";

const stats = [
  { value: "50+", label: "businesses empowered across Africa" },
  { value: "12", label: "industries transformed" },
  { value: "200+", label: "professionals trained on AI tools" },
  { value: "95%", label: "client satisfaction rate" },
];

export default function StatsSection() {
  return (
    <section className="py-24 md:py-32 relative grain-overlay overflow-hidden" style={{ background: 'hsl(0 0% 97%)' }}>
      <div className="container relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({ stat, index }: { stat: (typeof stats)[number]; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <div
      ref={ref}
      className={`text-center ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <p className="font-heading font-bold text-4xl md:text-5xl text-primary tabular-nums">
        {stat.value}
      </p>
      <p className="mt-3 text-muted-foreground text-sm uppercase tracking-wider font-heading">
        {stat.label}
      </p>
    </div>
  );
}
