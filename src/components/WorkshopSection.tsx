import lead from "@/assets/visuals/lead-portrait.jpg";
import { WhatsAppButton } from "@/components/Actions";
import Reveal from "@/components/Reveal";

export default function WorkshopSection() {
  return (
    <section id="workshops" className="section section-light">
      <div className="wrap grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <Reveal>
          <h2 className="h2">AI workshops for your team.</h2>
          <p className="mt-5 text-lg text-slate">
            A tool only pays off when people use it. Our workshops are practical sessions built
            around the work your team already does, so they leave using AI and not just knowing
            about it.
          </p>
          <div className="mt-8">
            <WhatsAppButton
              onLight
              label="Ask about a workshop"
              message="Hi Zentia, I'd like to know more about an AI workshop for my team."
            />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <img
            src={lead}
            alt="A team lead standing with arms folded in a bright office, smiling"
            width={1400}
            height={739}
            loading="lazy"
            className="pill-wide aspect-[16/9] w-full object-cover"
          />
        </Reveal>
      </div>
    </section>
  );
}
