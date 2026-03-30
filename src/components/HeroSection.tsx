import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection({ onGetInTouch }: { onGetInTouch?: () => void }) {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 grain-overlay overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-primary/60 animate-float-sparkle" />
      <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 rounded-full bg-primary/40 animate-float-sparkle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 left-1/4 w-3 h-3">
        <svg viewBox="0 0 24 24" fill="none" className="text-primary/30 animate-float-sparkle" style={{ animationDelay: '0.5s' }}>
          <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z" fill="currentColor" />
        </svg>
      </div>

      <div ref={ref} className="container text-center relative z-10 max-w-4xl">
        <div
          className={`${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
        >
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground text-balance">
            We bridge Africa's AI knowledge gap.
          </h1>
        </div>

        <div
          className={`mt-8 ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
          style={{ animationDelay: '150ms' }}
        >
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto text-pretty leading-relaxed">
            We help African businesses identify AI opportunities that drive real transformation, then we build it, deploy it, and train your team to own it.
          </p>
        </div>

        <div
          className={`mt-12 flex flex-col sm:flex-row gap-4 justify-center ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
          style={{ animationDelay: '300ms' }}
        >
          <Button variant="hero" size="lg" className="gap-2 px-8 py-6" onClick={onGetInTouch}>
            Get in Touch <ArrowRight size={16} />
          </Button>
          <Button variant="heroOutline" size="lg" className="px-8 py-6" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
            Our Services
          </Button>
        </div>
      </div>
    </section>
  );
}
