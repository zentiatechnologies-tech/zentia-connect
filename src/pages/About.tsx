import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { User } from "lucide-react";

const founders = [
  {
    name: "Kazoora Abayo",
    role: "CEO & Co-Founder",
    description:
      "Creative strategist with a passion for unlocking business potential through smart automation. Kazoora brings deep local market understanding and a relentless focus on outcomes that matter.",
  },
  {
    name: "Diana Nakiwala",
    role: "CTO & Co-Founder",
    description:
      "Technical architect who turns complex AI systems into elegant, practical solutions. Diana ensures every deployment is robust, scalable, and built for real-world African business conditions.",
  },
];

export default function About() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onGetInTouch={() => setContactOpen(true)} />

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 relative grain-overlay">
        <div className="container max-w-4xl relative z-10">
          <RevealBlock delay={0}>
            <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-foreground text-balance leading-[1.1]">
              About Zentia
            </h1>
          </RevealBlock>
          <RevealBlock delay={100}>
            <p className="mt-6 text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl text-pretty">
              We exist to prove world-class automation can emerge from Kampala and transform the continent.
            </p>
          </RevealBlock>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 md:py-28 relative grain-overlay" style={{ background: "hsl(0 0% 97%)" }}>
        <div className="container max-w-4xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <RevealBlock delay={0}>
              <div>
                <span className="font-heading text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                  Vision
                </span>
                <h2 className="font-heading font-bold text-2xl md:text-3xl text-zentia-navy mt-3 mb-5 text-balance leading-snug">
                  AI efficiency as the standard, not the privilege
                </h2>
                <p className="text-zentia-gray leading-relaxed text-pretty">
                  Make AI-powered efficiency the standard for African businesses, not the privilege. We exist to prove world-class automation can emerge from Kampala and transform the continent.
                </p>
              </div>
            </RevealBlock>
            <RevealBlock delay={120}>
              <div>
                <span className="font-heading text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                  Mission
                </span>
                <h2 className="font-heading font-bold text-2xl md:text-3xl text-zentia-navy mt-3 mb-5 text-balance leading-snug">
                  Bridging Africa's AI knowledge gap
                </h2>
                <p className="text-zentia-gray leading-relaxed text-pretty">
                  We bridge Africa's AI knowledge gap — by empowering businesses with the right AI knowledge and tools to save time, cut costs, and scale profitably.
                </p>
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-28 relative grain-overlay">
        <div className="container max-w-3xl relative z-10">
          <RevealBlock delay={0}>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-8 text-balance">
              Why Zentia exists
            </h2>
          </RevealBlock>
          <RevealBlock delay={80}>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6 text-pretty">
              AI adoption in African businesses lags behind global markets not because of cost or access, but because of a fundamental gap: business owners know automation exists, but lack the expertise to identify, implement, and optimize the right tools for their specific workflows. Zentia Technologies exists to bridge this execution gap, transforming AI from a distant buzzword into a practical competitive advantage for businesses that previously assumed automation was reserved for enterprises with dedicated tech teams.
            </p>
          </RevealBlock>
          <RevealBlock delay={160}>
            <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
              Co-founded by a creative strategist and technical architect, Zentia operates without the friction that kills most consulting engagements: no technical jargon, no generic recommendations, no "educate and depart" handoffs. We speak business outcomes first, technical architecture second, delivering end-to-end automation with deep local market understanding that foreign AI consultancies cannot replicate.
            </p>
          </RevealBlock>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 md:py-28 relative grain-overlay" style={{ background: "hsl(0 0% 97%)" }}>
        <div className="container max-w-4xl relative z-10">
          <RevealBlock delay={0}>
            <span className="font-heading text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Leadership
            </span>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-zentia-navy mt-3 mb-12 text-balance">
              The people behind Zentia
            </h2>
          </RevealBlock>

          <div className="grid md:grid-cols-2 gap-10">
            {founders.map((founder, i) => (
              <FounderCard key={founder.name} founder={founder} index={i} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}

function FounderCard({
  founder,
  index,
}: {
  founder: (typeof founders)[number];
  index: number;
}) {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <div
      ref={ref}
      className={isVisible ? "animate-reveal-up" : "opacity-0"}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="rounded-xl border border-border/40 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Photo placeholder */}
        <div className="aspect-[4/5] bg-zentia-navy/5 flex items-center justify-center">
          <User className="w-20 h-20 text-zentia-gray/30" strokeWidth={1} />
        </div>
        <div className="p-6">
          <h3 className="font-heading font-bold text-xl text-zentia-navy">
            {founder.name}
          </h3>
          <p className="text-primary font-heading text-sm font-semibold mt-1 uppercase tracking-wide">
            {founder.role}
          </p>
          <p className="text-zentia-gray text-sm leading-relaxed mt-3">
            {founder.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function RevealBlock({ children, delay }: { children: React.ReactNode; delay: number }) {
  const { ref, isVisible } = useScrollReveal(0.2);
  return (
    <div
      ref={ref}
      className={isVisible ? "animate-reveal-up" : "opacity-0"}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
