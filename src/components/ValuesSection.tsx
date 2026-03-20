import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Lightbulb, Globe, Layers, Award, Heart } from "lucide-react";

const values = [
  { icon: Lightbulb, title: "Innovation", description: "Pushing boundaries to deliver cutting-edge AI solutions tailored for African markets." },
  { icon: Globe, title: "Accessibility", description: "Making AI understandable and usable for every business, regardless of technical maturity." },
  { icon: Layers, title: "Abundance", description: "Creating shared value and believing in the limitless potential of AI across the continent." },
  { icon: Award, title: "Excellence", description: "Delivering work that meets the highest global standards with local insight and care." },
  { icon: Heart, title: "Passion", description: "Driven by a deep commitment to Africa's digital transformation and future prosperity." },
];

export default function ValuesSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.2);

  return (
    <section id="values" className="py-24 md:py-32 bg-card relative grain-overlay">
      <div className="container relative z-10">
        <div ref={headerRef}>
          <div className={`flex items-center gap-3 mb-6 ${headerVisible ? 'animate-reveal-up' : 'opacity-0'}`}>
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="font-heading text-xs uppercase tracking-widest text-primary">Our Values</p>
          </div>
          <h2
            className={`font-heading font-bold text-3xl md:text-4xl text-foreground mb-16 text-balance ${headerVisible ? 'animate-reveal-up' : 'opacity-0'}`}
            style={{ animationDelay: '100ms' }}
          >
            What drives everything we do.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((val, i) => (
            <ValueCard key={val.title} value={val} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCard({ value, index }: { value: (typeof values)[number]; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.2);
  const Icon = value.icon;

  return (
    <div
      ref={ref}
      className={`group p-8 rounded-xl border border-border/40 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_4px_24px_rgba(1,195,142,0.06)] ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300">
        <Icon size={22} className="text-primary" />
      </div>
      <h3 className="font-heading font-bold text-lg text-foreground mb-3">{value.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
    </div>
  );
}
