import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const faqs = [
  {
    q: "What makes Zentia different from other AI consultancies?",
    a: "We're Africa-focused and results-driven. We start by understanding how your teams actually work, then build AI solutions that fit your context, not one-size-fits-all tools from elsewhere. We're tool-agnostic but outcome-obsessed.",
  },
  {
    q: "How do I know if my business is ready for AI?",
    a: "If you have repetitive processes, growing data, or teams spending time on tasks that could be automated, you're ready. We'll help you identify what's worth pursuing and what's not.",
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
    q: "We don't have a technical team. Can we still work with you?",
    a: "Absolutely. We handle the technical complexity so your team can focus on their real work. Our training ensures your people are confident using AI tools day-to-day.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="section section-light">
      <div className="wrap grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
        <h2 className="h2">Questions we hear often.</h2>
        <Accordion type="single" collapsible defaultValue="faq-0">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="border-navy/15">
              <AccordionTrigger className="py-5 text-left text-lg font-semibold text-navy hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-slate">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
