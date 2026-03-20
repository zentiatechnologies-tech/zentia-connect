import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const statements = [
  "You know AI is reshaping industries across the continent.",
  "But finding the right talent, tools, and strategy feels overwhelming.",
  "Pilots stall. Teams aren't trained. ROI remains unclear.",
  "You're not behind. You just need the right partner.",
  "That's why we built Zentia.",
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Section is tall (e.g. 300vh). Progress 0→1 as we scroll through it.
      // The sticky container sits in the middle of the viewport.
      const scrollable = el.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(Math.max(0, Math.min(1, scrolled / scrollable)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const count = statements.length;

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative grain-overlay"
      style={{ height: `${count * 80 + 100}vh` }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container max-w-3xl relative z-10">
          <div className="relative" style={{ height: '260px' }}>
            {statements.map((text, i) => {
              const isLast = i === count - 1;
              // Each line gets a slot in the progress
              const lineCenter = (i + 0.5) / count;
              const dist = progress - lineCenter;
              // How far this line has scrolled past (positive = scrolled up past center)
              const offsetY = dist * count * 80; // pixels of vertical shift
              const absDist = Math.abs(dist * count);
              const opacity = isLast
                ? Math.max(0, Math.min(1, 1 - absDist * 1.2))
                : dist > 0
                  ? Math.max(0, 1 - dist * count * 1.5) // fading out as it scrolls up
                  : Math.max(0, Math.min(1, 1 - absDist * 1.5)); // fading in from below

              return (
                <h2
                  key={i}
                  className={`font-heading text-xl md:text-2xl leading-snug absolute left-0 right-0 ${isLast ? 'font-bold' : 'font-medium'}`}
                  style={{
                    top: '50%',
                    transform: `translateY(calc(-50% + ${offsetY}px))`,
                    opacity,
                    color: isLast
                      ? 'hsl(160 99% 39%)'
                      : 'hsl(0 0% 100%)',
                    filter: `blur(${Math.max(0, (1 - opacity) * 3)}px)`,
                    willChange: 'transform, opacity',
                  }}
                >
                  {text}
                </h2>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom content revealed after sticky scroll */}
      <div className="absolute bottom-0 left-0 right-0 pb-24 md:pb-32">
        <div className="container max-w-3xl relative z-10">
          <div className="border-t border-border/40 pt-16">
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
