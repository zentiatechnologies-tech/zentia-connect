import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, FileText, Video, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import { usePageMeta } from "@/hooks/usePageMeta";
import { pages } from "@/config/seo";
import { site } from "@/config/site";
import glassTeal from "@/assets/visuals/glass-teal.jpg";

type Resource = {
  title: string;
  description: string;
  kind: string;
  icon: typeof BookOpen;
  /** Paste the file's share link here to turn the button into a download. */
  link: string;
};

const resources: Resource[] = [
  {
    title: "AI Implementation Guide for African Businesses",
    description: "A step-by-step guide to integrating AI solutions into your business operations.",
    kind: "Guide",
    icon: BookOpen,
    link: "",
  },
  {
    title: "Introduction to AI for Decision Makers",
    description: "A concise overview of AI capabilities and how they translate to business value.",
    kind: "Whitepaper",
    icon: FileText,
    link: "",
  },
  {
    title: "AI Use Cases Across African Industries",
    description: "Examples of AI at work in agriculture, finance, healthcare and more.",
    kind: "Guide",
    icon: BookOpen,
    link: "",
  },
  {
    title: "Business Process Automation Checklist",
    description: "Identify which processes in your organisation are ready for AI-driven automation.",
    kind: "Template",
    icon: FileText,
    link: "",
  },
  {
    title: "Data Readiness Assessment Template",
    description: "Evaluate whether your data infrastructure is prepared for AI integration.",
    kind: "Template",
    icon: FileText,
    link: "",
  },
  {
    title: "Getting Started with Zentia: Video Walkthrough",
    description: "Watch how Zentia helps businesses deploy AI solutions quickly and effectively.",
    kind: "Video",
    icon: Video,
    link: "",
  },
];

const requestLink = (title: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(`Please send me: ${title}`)}`;

export default function Resources() {
  usePageMeta(pages.resources);
  return (
    <Layout>
      <section className="hero hero-short">
        <img src={glassTeal} alt="" aria-hidden="true" className="hero-bg" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="wrap relative z-10 pb-14 pt-36 md:pb-16 md:pt-44">
          <h1 className="display max-w-3xl">Guides and templates to get started with AI.</h1>
          <p className="lede mt-6 max-w-2xl">Free to use. Ask for a copy and we'll email it to you.</p>
        </div>
      </section>

      <section className="section section-light">
        <div className="wrap">
          <div className="hub-callout">
            <div>
              <h2 className="h3">Looking for tools, not reading?</h2>
              <p className="mt-2 text-white/80">
                The Tool Hub shortlists AI tools for your line of work in four questions.
              </p>
            </div>
            <Link to="/tools/" className="btn btn-primary shrink-0">
              Open the Tool Hub
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="wrap mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <article key={r.title} className="resource">
              <div className="flex items-center gap-3 text-slate">
                <span className="resource-icon">
                  <r.icon size={20} aria-hidden="true" />
                </span>
                {r.kind}
              </div>
              <h2 className="mt-5 text-xl font-bold leading-snug text-navy">{r.title}</h2>
              <p className="mt-3 flex-1 text-slate">{r.description}</p>
              {r.link ? (
                <a href={r.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm mt-6">
                  Download
                </a>
              ) : (
                <a href={requestLink(r.title)} className="btn btn-outline-dark btn-sm mt-6">
                  <Mail size={16} aria-hidden="true" />
                  Request a copy
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

      <CTASection />
    </Layout>
  );
}
