import { useScrollReveal } from "@/hooks/useScrollReveal";

const points = [
  "AI ideas stall before they ship.",
  "Teams aren't trained to use the tools.",
  "ROI stays unclear.",
];

export default function ProblemSection() {
  const { ref, isVisible } = useScrollReveal(0.25);

  return (
    <section id="about" className="relative grain-overlay py-24 md:py-32">
      <div ref={ref} className="container max-w-4xl relative z-10 text-center">
        <h2
          className={`font-heading font-bold text-2xl md:text-4xl leading-tight text-balance text-foreground ${
            isVisible ? "animate-reveal-up" : "opacity-0"
          }`}
        >
          You know AI is reshaping industries across the continent. Finding the
          right talent, tools and strategy is the hard part.
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {points.map((point, i) => (
            <div
              key={point}
              className={`rounded-lg border border-border/40 bg-card/40 p-6 text-left ${
                isVisible ? "animate-reveal-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${120 + i * 120}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <p className="text-muted-foreground leading-relaxed">{point}</p>
              </div>
            </div>
          ))}
        </div>

        <p
          className={`mt-12 font-heading font-bold text-xl md:text-2xl text-balance text-primary ${
            isVisible ? "animate-reveal-up" : "opacity-0"
          }`}
          style={{ animationDelay: "480ms" }}
        >
          You're not behind. You just need the right partner.
        </p>

        <p
          className={`mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed text-pretty ${
            isVisible ? "animate-reveal-up" : "opacity-0"
          }`}
          style={{ animationDelay: "600ms" }}
        >
          Zentia identifies what's worth building, builds it with you, then
          trains your people to make it stick.
        </p>
      </div>
    </section>
  );
}
