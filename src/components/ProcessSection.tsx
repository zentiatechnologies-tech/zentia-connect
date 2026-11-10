import LoopVideo from "@/components/LoopVideo";
import Reveal from "@/components/Reveal";

const steps = [
  {
    title: "Consult",
    text: "We map your workflows, find the bottlenecks and pick the AI opportunities with the highest return.",
  },
  {
    title: "Build",
    text: "We design and build the solution to fit the systems you already run, starting with a working pilot.",
  },
  {
    title: "Train",
    text: "We work beside your team until the new tools are simply how the work gets done.",
  },
];

export default function ProcessSection() {
  return (
    <section id="process" className="section section-deep">
      <div className="wrap grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <LoopVideo
            src="/media/proposal-demo.mp4"
            poster="/media/proposal-demo.jpg"
            label="An office worker uses an AI assistant on her computer to generate a client proposal"
            className="photo-frame aspect-video w-full object-cover"
          />
        </Reveal>
        <Reveal delay={100}>
          <h2 className="h2">How an engagement runs.</h2>
          <ol className="mt-8 space-y-7">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5">
                <span className="step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-white/75">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
