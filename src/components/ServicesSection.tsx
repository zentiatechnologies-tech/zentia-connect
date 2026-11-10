import { Check, ArrowUpRight } from "lucide-react";
import { offers, whatsappLink } from "@/config/site";
import Reveal from "@/components/Reveal";

export default function ServicesSection() {
  return (
    <section id="services" className="section section-dark">
      <div className="wrap">
        <Reveal>
          <h2 className="h2 max-w-2xl">Four ways to work with us.</h2>
          <p className="lede mt-4 max-w-2xl">
            Most clients start with the audit. Take one service on its own, or go from audit to a
            trained team.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {offers.map((o, i) => (
            <Reveal key={o.slug} delay={i * 70}>
              <article className={`offer ${o.startHere ? "offer-start" : ""}`}>
                {o.startHere && <p className="offer-flag">Start here</p>}
                <h3 className="h3">{o.name}</h3>
                <p className="mt-3 text-white/75">{o.summary}</p>

                <ul className="mt-6 space-y-2.5">
                  {o.includes.map((line) => (
                    <li key={line} className="flex gap-3 text-white/90">
                      <Check size={18} className="mt-1 shrink-0 text-green" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ul>

                <dl className="offer-facts">
                  <div>
                    <dt>Timeline</dt>
                    <dd>{o.timeline || "Agreed on your call"}</dd>
                  </div>
                  <div>
                    <dt>Starting price</dt>
                    <dd>{o.startingPrice || "Quoted after your call"}</dd>
                  </div>
                </dl>

                <a
                  href={whatsappLink(`Hi Zentia, I'd like to know more about the ${o.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link mt-6"
                >
                  Ask about this service
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
