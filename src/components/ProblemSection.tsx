import { useScrollReveal } from "@/hooks/useScrollReveal";

const statements = [
  "You know AI is reshaping industries across the continent.",
  "But finding the right talent, tools, and strategy feels overwhelming.",
  "Pilots stall. Teams aren't trained. ROI remains unclear.",
  "You're not behind — you just need the right partner.",
  "That's why we built Zentia.",
];

export default function ProblemSection() {
  return (
    <section id="about" className="py-24 md:py-32 relative grain-overlay">
      <div className="container max-w-3xl relative z-10">
        {statements.map((text, i) => (
          <ProblemLine key={i} text={text} index={i} />
        ))}

        <div className="mt-16 border-t border-border/40 pt-16">
          <RevealBlock delay={0}>
            <p className="text-primary font-heading font-bold text-2xl md:text-3xl text-balance">
              AI that actually moves Africa forward.
            </p>
          </RevealBlock>
          <RevealBlock delay={120}>
            <p className="mt-6 text-muted-foreground text-lg text-pretty max-w-xl leading-relaxed">
              Zentia identifies what's worth building, builds it with you, then trains your people to make it stick. From strategy to adoption — we're with you at every step.
            </p>
          </RevealBlock>
        </div>
      </div>
    </section>
  );
}

function ProblemLine({ text, index }: { text: string; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.3);
  const isLast = index === 4;

  return (
    <div ref={ref} className={`${index > 0 ? 'mt-8' : ''}`}>
      <h2
        className={`font-heading text-xl md:text-2xl leading-snug ${isLast ? 'text-primary font-bold' : 'text-muted-foreground font-medium'} ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {text}
      </h2>
    </div>
  );
}

function RevealBlock({ children, delay }: { children: React.ReactNode; delay: number }) {
  const { ref, isVisible } = useScrollReveal(0.3);
  return (
    <div ref={ref} className={isVisible ? 'animate-reveal-up' : 'opacity-0'} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
