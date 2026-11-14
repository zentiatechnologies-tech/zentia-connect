// One place for everything a non-developer may need to change:
// contact details, the booking link, offers, prices and team links.

const PHONE_E164 = "256793391078";

export const site = {
  name: "Zentia Technologies",
  url: "https://zentiaai.com",
  email: "info@zentiaai.com",
  phoneDisplay: "+256 793 391 078",
  phoneHref: `tel:+${PHONE_E164}`,
  /** Your Cal.com event, without "https://cal.com/", e.g. "zentia/20min".
   *  Until it is set, the booking pop-up collects details and you confirm
   *  the time yourself. */
  calLink: (import.meta.env.VITE_CAL_LINK as string | undefined) || "",
  questionnaireUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSfeBSzD6KqYEuxTsDnBrLbnBkixy3FRge_bBoty4-N54KvTkg/viewform?usp=header",
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/zentia-technologies/" },
    { label: "X", href: "https://x.com/ZentiaTech" },
    { label: "Instagram", href: "https://www.instagram.com/zentiaai/" },
    { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61577446617141" },
  ],
};

export const cta = {
  label: "Book a free 20-minute call",
  longLabel: "Book a free 20-minute AI readiness call",
};

export function whatsappLink(message = "Hi Zentia, I'd like to talk about using AI in my business.") {
  return `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(message)}`;
}

/** Used only if JavaScript has not loaded: a pre-written email asking for the call. */
export function bookingLink() {
  const subject = "Free 20-minute AI readiness call";
  const body =
    "Hi Zentia,\n\nI'd like to book a free 20-minute AI readiness call.\n\nBusiness name:\nWhat we do:\nGood times for a call:\n";
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export type Offer = {
  slug: string;
  name: string;
  summary: string;
  includes: string[];
  /** e.g. "2 weeks". Leave empty to show "Agreed on your call". */
  timeline: string;
  /** e.g. "From UGX 1,500,000". Leave empty to show "Quoted after your call". */
  startingPrice: string;
  startHere?: boolean;
};

export const offers: Offer[] = [
  {
    slug: "audit",
    name: "AI Readiness Audit",
    summary:
      "We map how your team works today and rank where AI would save the most time and money.",
    includes: [
      "A review of your workflows and current tools",
      "AI opportunities ranked by impact and effort",
      "A written roadmap that is yours to keep",
    ],
    timeline: "",
    startingPrice: "",
    startHere: true,
  },
  {
    slug: "strategy",
    name: "Strategy Consulting",
    summary:
      "A plan for adopting AI across the business: what to do first, what to skip and what it will cost.",
    includes: [
      "Priorities and a business case for each",
      "Help choosing tools and vendors",
      "An adoption plan with named owners",
    ],
    timeline: "",
    startingPrice: "",
  },
  {
    slug: "builds",
    name: "Custom Builds",
    summary:
      "We design and build the AI tools and automations your business needs, fitted to the systems you already use.",
    includes: [
      "A working pilot before any large commitment",
      "Integration with your existing systems",
      "Handover and support after launch",
    ],
    timeline: "",
    startingPrice: "",
  },
  {
    slug: "training",
    name: "Training & Workshops",
    summary:
      "Hands-on sessions that get your people using AI tools confidently in their daily work.",
    includes: [
      "Practical exercises on your team's real tasks",
      "Sessions for staff or for leadership",
      "Materials your team keeps afterwards",
    ],
    timeline: "",
    startingPrice: "",
  },
];

export const founders = [
  {
    name: "Kazoora Abayo",
    role: "CEO and co-founder",
    bio: "Creative strategist with a passion for unlocking business potential through smart automation. Kazoora brings deep local market understanding and a relentless focus on outcomes that matter.",
    photo: "kazoora" as const,
    /** Paste the personal LinkedIn profile URL to show the link. */
    linkedin: "",
  },
  {
    name: "Diana Nakiwala",
    role: "CTO and co-founder",
    bio: "Technical architect who turns complex AI systems into practical solutions. Diana makes sure every deployment is robust, scalable and built for real African business conditions.",
    photo: "diana" as const,
    linkedin: "",
  },
];
