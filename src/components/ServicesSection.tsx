import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Code2, GraduationCap } from "lucide-react";

const services = [
  {
    num: "1",
    title: "Consult",
    icon: Search,
    description:
      "Every engagement starts with understanding. We map your workflows, uncover bottlenecks, and pinpoint the AI opportunities that will deliver the highest impact for your business.",
  },
  {
    num: "2",
    title: "Build",
    icon: Code2,
    description:
      "Once we know what matters, we move fast. Our team designs and develops custom AI solutions that integrate seamlessly with your existing systems — built right from day one.",
  },
  {
    num: "3",
    title: "Train",
    icon: GraduationCap,
    description:
      "We work alongside your teams — training, fine-tuning, and embedding AI into daily workflows. By the time we step back, it's not a project anymore. It's how work gets done.",
  },
];

export default function ServicesSection({ onGetInTouch }: { onGetInTouch?: () => void }) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal(0.2);

  return (
    <section id="services" className="py-24 md:py-32 bg-card relative grain-overlay">
      <div className="container relative z-10">
        <div ref={headerRef} className="flex items-center gap-3 mb-16">
          <div className={`w-2 h-2 rounded-full bg-primary ${headerVisible ? 'animate-reveal-up' : 'opacity-0'}`} />
          <p
            className={`font-heading text-xs uppercase tracking-widest text-primary ${headerVisible ? 'animate-reveal-up' : 'opacity-0'}`}
            style={{ animationDelay: '80ms' }}
          >
            Our approach
          </p>
        </div>

        <h2
          className={`font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-20 max-w-2xl text-balance leading-tight ${headerVisible ? 'animate-reveal-up' : 'opacity-0'}`}
          style={{ animationDelay: '160ms' }}
        >
          Three steps to AI-powered efficiency.
        </h2>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="hero" size="lg" className="gap-2 px-8 py-6">
            Get in Touch <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  index,
}: {
  service: (typeof services)[number];
  index: number;
}) {
  const { ref, isVisible } = useScrollReveal(0.2);
  const Icon = service.icon;

  return (
    <div
      ref={ref}
      className={`group relative ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-4 mb-6">
        <span className="font-heading text-5xl font-bold text-primary/20">
          {service.num}
        </span>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
      </div>

      <h3 className="font-heading font-bold text-xl text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
        {service.title}
      </h3>

      <p className="text-muted-foreground leading-relaxed text-pretty">
        {service.description}
      </p>

      <div className="mt-6 h-px bg-border/40 group-hover:bg-primary/30 transition-colors duration-500" />
    </div>
  );
}
