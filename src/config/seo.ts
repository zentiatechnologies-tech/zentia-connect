import { site } from "./site";

export type PageMeta = { path: string; title: string; description: string };

export const pages: Record<string, PageMeta> = {
  home: {
    path: "/",
    title: "Zentia | AI consulting, builds and training in Kampala",
    description:
      "Zentia helps African businesses put AI to work: AI readiness audits, strategy, custom builds and team training. Book a free 20-minute AI readiness call.",
  },
  about: {
    path: "/about/",
    title: "About Zentia Technologies | AI partner for African businesses",
    description:
      "Zentia Technologies is a Kampala-based team helping African businesses put AI to work. Meet co-founders Kazoora Abayo and Diana Nakiwala.",
  },
  resources: {
    path: "/resources/",
    title: "AI guides and templates for African businesses | Zentia",
    description:
      "Guides, checklists and templates from Zentia Technologies to help your business get started with AI and automation.",
  },
  tools: {
    path: "/tools/",
    title: "AI Tool Hub: 46 vetted AI tools for African businesses | Zentia",
    description:
      "Answer four questions and get a shortlist of AI tools that fit your work, budget and comfort with tech. 46 tools vetted by Zentia. Free, no sign-up.",
  },
  notFound: {
    path: "/404.html",
    title: "Page not found | Zentia Technologies",
    description: "This page does not exist. Head back to the Zentia Technologies home page.",
  },
};

export const canonical = (p: PageMeta) => site.url + p.path;
