import analyst from "@/assets/visuals/analyst-charts.jpg";
import glassLight from "@/assets/visuals/glass-light.jpg";
import Reveal from "@/components/Reveal";

const points = [
  "AI ideas stall before they ship.",
  "Teams aren't trained to use the tools.",
  "The return on investment stays unclear.",
];

export default function ProblemSection() {
  return (
    <section className="section section-light relative overflow-hidden">
      <img src={glassLight} alt="" aria-hidden="true" className="section-glass" />
      <div className="wrap relative z-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <img
            src={analyst}
            alt="A smiling analyst at her desk holding up a printed page of charts"
            width={1400}
            height={933}
            loading="lazy"
            className="photo-frame aspect-[4/3] w-full object-cover"
          />
        </Reveal>
        <Reveal delay={100}>
          <h2 className="h2">Knowing AI matters is easy. Knowing where to start is the hard part.</h2>
          <ul className="mt-7 space-y-3">
            {points.map((p) => (
              <li key={p} className="tick-row">
                <span className="tick-dash" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-7 text-lg font-semibold text-navy">
            You're not behind. You need the right partner.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
