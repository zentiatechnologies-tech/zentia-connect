import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const statements = [
  "You know AI is reshaping industries across the continent.",
  "But finding the right talent, tools, and strategy feels overwhelming.",
  "Pilots stall. Teams aren't trained. ROI remains unclear.",
  "You're not behind — you just need the right partner.",
  "That's why we built Zentia.",
];

export default function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      // progress 0 when top enters viewport, 1 when bottom leaves
      const total = rect.height + viewH;
      const scrolled = viewH - rect.top;
      setProgress(Math.max(0, Math.min(1, scrolled / total)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="about" className="py-24 md:py-40 relative grain-overlay">
      <div ref={containerRef} className="container max-w-3xl relative z-10">
        <div className="space-y-8">
          {statements.map((text, i) => {
            const count = statements.length;
            // Each line activates over a portion of the scroll
            const lineStart = (i / count) * 0.7;
            const lineEnd = ((i + 1) / count) * 0.7 + 0.1;
            const lineProgress = Math.max(0, Math.min(1, (progress - lineStart) / (lineEnd - lineStart)));
            const isLast = i === count - 1;

            return (
              <h2
                key={i}
                className={`font-heading text-xl md:text-2xl leading-snug transition-none ${isLast ? 'font-bold' : 'font-medium'}`}
                style={{
                  opacity: 0.15 + lineProgress * 0.85,
                  color: isLast
                    ? `hsl(160 99% ${39 + (1 - lineProgress) * 30}% / ${0.15 + lineProgress * 0.85})`
                    : `hsl(0 0% 100% / ${0.15 + lineProgress * 0.85})`,
                  filter: `blur(${(1 - lineProgress) * 2}px)`,
                  transform: `translateY(${(1 - lineProgress) * 6}px)`,
                }}
              >
                {text}
              </h2>
            );
          })}
        </div>

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

function RevealBlock({ children, delay }: { children: React.ReactNode; delay: number }) {
  const { ref, isVisible } = useScrollReveal(0.3);
  return (
    <div ref={ref} className={isVisible ? 'animate-reveal-up' : 'opacity-0'} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
