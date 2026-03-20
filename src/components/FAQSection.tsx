import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What makes Zentia different from other AI consultancies?",
    a: "We're Africa-focused and results-driven. We start by understanding how your teams actually work, then build AI solutions that fit your context — not one-size-fits-all tools from elsewhere. We're tool-agnostic but outcome-obsessed.",
  },
  {
    q: "How do I know if my business is ready for AI?",
    a: "If you have repetitive processes, growing data, or teams spending time on tasks that could be automated — you're ready. We'll help you identify what's worth pursuing and what's not.",
  },
  {
    q: "What happens after you deliver a solution?",
    a: "We don't disappear. We provide hands-on training, monitor adoption, and iterate until the AI solution is running smoothly without us. Post-launch support is core to our offering.",
  },
  {
    q: "How long until we see real results?",
    a: "Most clients see a working pilot within weeks. We move fast, validate early, and scale only once value is proven.",
  },
  {
    q: "We don't have a technical team — can we still work with you?",
    a: "Absolutely. We handle the technical complexity so your team can focus on their real work. Our training ensures your people are confident using AI tools day-to-day.",
  },
];

export default function FAQSection() {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section id="faq" className="py-24 md:py-32 relative grain-overlay" style={{ background: 'hsl(0 0% 97%)' }}>
      <div className="container max-w-3xl relative z-10">
        <div ref={ref}>
          <h2
            className={`font-heading font-bold text-3xl md:text-4xl text-zentia-navy mb-4 ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
          >
            FAQs
          </h2>
          <p
            className={`text-zentia-gray mb-12 ${isVisible ? 'animate-reveal-up' : 'opacity-0'}`}
            style={{ animationDelay: '80ms' }}
          >
            You've got questions. We've got answers.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FAQItem({ faq, index }: { faq: (typeof faqs)[number]; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <div
      ref={ref}
      className={isVisible ? 'animate-reveal-up' : 'opacity-0'}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <AccordionItem value={`faq-${index}`} className="border-border/40">
        <AccordionTrigger className="font-heading font-semibold text-left text-zentia-navy hover:text-primary transition-colors py-5">
          {faq.q}
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
          {faq.a}
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}
