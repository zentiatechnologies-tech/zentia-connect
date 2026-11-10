import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import glassLight from "@/assets/visuals/glass-light.jpg";
import Reveal from "@/components/Reveal";
import { professions, searchTools, tools } from "@/lib/toolhub/model";

/** Home page teaser for the Tool Hub, showing a few real entries. */
export default function ToolHubSection() {
  const sample = searchTools("", "", "").slice(0, 4);

  return (
    <section id="tool-hub" className="section section-light relative overflow-hidden border-t border-navy/15">
      <img src={glassLight} alt="" aria-hidden="true" className="section-glass" loading="lazy" />
      <div className="wrap relative z-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <h2 className="h2">Find the right AI tools in two minutes.</h2>
          <p className="mt-5 text-lg text-slate">
            The Zentia Tool Hub lists {tools.length} tools we have vetted for {professions.length}{" "}
            lines of work. Answer four questions and get a shortlist that fits you, with a 3-week
            plan to learn them. Free, no sign-up.
          </p>
          <Link to="/tools/" className="btn btn-primary mt-8">
            Open the Tool Hub
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <ul className="hub-sample">
            {sample.map((t) => (
              <li key={t.id}>
                <div className="min-w-0">
                  <p className="font-heading text-lg font-bold text-navy">{t.name}</p>
                  <p className="truncate text-slate">{t.cat}</p>
                </div>
                <span className="score score-light" title="Zentia score out of 5">
                  {t.editor.toFixed(1)}
                </span>
              </li>
            ))}
            <li className="hub-sample-more">
              <Link to="/tools/" className="font-semibold text-navy underline underline-offset-4">
                and {tools.length - sample.length} more
              </Link>
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
