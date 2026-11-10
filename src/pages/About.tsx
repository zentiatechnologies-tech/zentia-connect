import { Linkedin } from "lucide-react";
import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import Reveal from "@/components/Reveal";
import { usePageMeta } from "@/hooks/usePageMeta";
import { pages } from "@/config/seo";
import { founders } from "@/config/site";
import glassTeal from "@/assets/visuals/glass-teal.jpg";
import kazoora from "@/assets/kazoora-abayo-web.jpg";
import diana from "@/assets/diana-nakiwala-web.jpg";

const photos = { kazoora, diana };

export default function About() {
  usePageMeta(pages.about);
  return (
    <Layout>
      <section className="hero hero-short">
        <img src={glassTeal} alt="" aria-hidden="true" className="hero-bg" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="wrap relative z-10 pb-16 pt-36 md:pb-20 md:pt-44">
          <h1 className="display max-w-3xl">We help African businesses put AI to work.</h1>
          <p className="lede mt-6 max-w-2xl">
            Zentia is a Kampala-based team that finds where AI will pay off in your business, builds
            it, and trains your people to run it.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <Reveal>
            <h2 className="h2">Why Zentia exists.</h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="space-y-5 text-lg leading-relaxed text-slate">
              <p>
                AI adoption in African businesses lags behind global markets, and not because of cost
                or access. Business owners know the tools exist. What is missing is the expertise to
                pick the right ones, put them in place and make them work for their own workflows.
              </p>
              <p>
                Zentia exists to close that gap, turning AI from a distant buzzword into a practical
                advantage for businesses that assumed it was reserved for enterprises with dedicated
                tech teams.
              </p>
              <p>
                Co-founded by a creative strategist and a technical architect, we speak business
                outcomes first and technical architecture second. No jargon, no generic
                recommendations, no "educate and depart" handoffs.
              </p>
              <p className="border-l-2 border-green pl-5 font-medium text-navy">
                Our aim is to make AI-powered efficiency the standard for African businesses, not a
                privilege, with work that is accessible to every business and held to global
                standards.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-dark">
        <div className="wrap">
          <Reveal>
            <h2 className="h2">The people behind Zentia.</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {founders.map((f, i) => (
              <Reveal key={f.name} delay={i * 100}>
                <article className="founder">
                  <img
                    src={photos[f.photo]}
                    alt={`${f.name}, ${f.role} of Zentia Technologies`}
                    width={900}
                    height={1125}
                    loading="lazy"
                    className="founder-photo"
                  />
                  <div>
                    <h3 className="h3">{f.name}</h3>
                    <p className="mt-1 font-medium text-green">{f.role}</p>
                    <p className="mt-4 text-white/75">{f.bio}</p>
                    {f.linkedin && (
                      <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="text-link mt-5">
                        <Linkedin size={18} aria-hidden="true" />
                        {f.name.split(" ")[0]} on LinkedIn
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </Layout>
  );
}
