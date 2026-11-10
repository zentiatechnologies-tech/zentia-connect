// Tool Hub data model: professions, goals, and the ranking and
// recommendation rules. The catalog itself lives in src/data/tool-catalog.json.
import catalog from "@/data/tool-catalog.json";

export type Tool = {
  id: string;
  name: string;
  maker: string;
  url: string;
  cat: string;
  price: "free" | "freemium" | "paid";
  /** 1 = anyone can start, 2 = some setup, 3 = technical */
  level: number;
  goals: string[];
  prof: string[];
  trusted: boolean;
  /** Zentia's vetting score, 1 to 5 */
  editor: number;
  blurb: string;
  steps: string[];
  uses: Record<string, string>;
  africa?: string;
  yt?: string;
  ch?: string;
  learn?: { label: string; url: string }[];
};

export const tools = catalog as Tool[];

export const professions = [
  { id: "retail", label: "Retail and trade" },
  { id: "hospitality", label: "Hospitality and tourism" },
  { id: "agri", label: "Agriculture" },
  { id: "services", label: "Professional services" },
  { id: "office", label: "Office and admin" },
  { id: "sales", label: "Sales" },
  { id: "education", label: "Education" },
  { id: "ngo", label: "NGO and non-profit" },
  { id: "health", label: "Healthcare" },
  { id: "realestate", label: "Real estate" },
  { id: "logistics", label: "Logistics and delivery" },
  { id: "creative", label: "Creative and media" },
  { id: "tech", label: "Tech and startups" },
] as const;

export const goals = [
  { id: "writing", label: "Write faster" },
  { id: "marketing", label: "Market my business" },
  { id: "customers", label: "Answer customers" },
  { id: "sales", label: "Find and track leads" },
  { id: "finance", label: "Manage money" },
  { id: "data", label: "Understand my data" },
  { id: "research", label: "Research" },
  { id: "meetings", label: "Meetings and notes" },
  { id: "design", label: "Design, video and audio" },
  { id: "automation", label: "Automate repetitive work" },
  { id: "language", label: "Local languages" },
  { id: "web", label: "Build a website or app" },
] as const;

export const comfortLevels = [
  { id: 1, label: "Keep it simple", hint: "I use WhatsApp and email" },
  { id: 2, label: "Some setup is fine", hint: "I can connect apps and import data" },
  { id: 3, label: "I'm technical", hint: "Code and APIs don't scare me" },
] as const;

export const budgets = [
  { id: "free", label: "Free to start", hint: "Free tools and free plans only" },
  { id: "any", label: "Open to paying", hint: "Include paid tools if they fit" },
] as const;

export const priceLabel: Record<Tool["price"], string> = {
  free: "Free",
  freemium: "Free plan available",
  paid: "Paid",
};

export const levelLabel = ["", "Beginner friendly", "Some setup", "Technical"];

export const profLabel = (id: string) => professions.find((p) => p.id === id)?.label ?? id;
export const goalLabel = (id: string) => goals.find((g) => g.id === id)?.label ?? id;

/** Community rating totals for one tool: overall and per profession. */
export type ToolStats = { votes: number; total: number; byProf: Record<string, { votes: number; total: number }> };
export type Stats = Record<string, ToolStats>;

const isGeneral = (t: Tool) => t.prof.includes("all");
export const fitsProfession = (t: Tool, prof: string) => isGeneral(t) || t.prof.includes(prof);

/** A tool's score out of 5. It starts from Zentia's editor score and is pulled
 *  up or down by community ratings as they come in. Ratings from people in the
 *  same profession count double. */
export function scoreOf(t: Tool, stats?: Stats, prof?: string): number {
  const s = stats?.[t.id];
  if (!s || s.votes === 0) return t.editor;
  const same = (prof && s.byProf[prof]) || { votes: 0, total: 0 };
  const votes = s.votes + same.votes;
  const total = s.total + same.total;
  return (t.editor * 5 + total) / (5 + votes);
}

/** Best picks for a profession: the score above, +0.2 for tools built for
 *  that profession and -0.2 for general-purpose ones, so each board differs. */
export function bestPicks(prof: string, count = 5, list: Tool[] = tools, stats?: Stats): Tool[] {
  const score = (t: Tool) => scoreOf(t, stats, prof) + (isGeneral(t) ? -0.2 : 0.2);
  return list
    .filter((t) => fitsProfession(t, prof))
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        // on a tie, the more specialised tool wins
        Number(isGeneral(a)) - Number(isGeneral(b)) ||
        a.prof.length - b.prof.length ||
        a.name.localeCompare(b.name),
    )
    .slice(0, count);
}

export type Answers = {
  prof: string;
  goals: string[];
  comfort: number;
  budget: "free" | "any";
};

export type Pick = { tool: Tool; reasons: string[] };

/** A personal shortlist. Balances goals, profession, comfort with tech and
 *  budget, and makes sure every chosen goal is covered by at least one tool
 *  whenever the catalog has one that fits. */
export function recommend(a: Answers, count = 6, list: Tool[] = tools, stats?: Stats): Pick[] {
  const allowed = list.filter(
    (t) => t.level <= a.comfort && (a.budget === "any" || t.price !== "paid"),
  );

  const score = (t: Tool) => {
    const matched = t.goals.filter((g) => a.goals.includes(g)).length;
    let s = scoreOf(t, stats, a.prof) + Math.min(matched, 2);
    if (t.prof.includes(a.prof)) s += 0.6;
    else if (isGeneral(t)) s += 0.2;
    else s -= 0.8;
    if (t.uses[a.prof]) s += 0.3;
    if (t.trusted) s += 0.1;
    return s;
  };

  const ranked = [...allowed].sort((x, y) => score(y) - score(x) || x.name.localeCompare(y.name));
  const chosen: Tool[] = [];

  // First pass: the best tool for each goal, so no goal is left uncovered.
  for (const g of a.goals) {
    if (chosen.some((t) => t.goals.includes(g))) continue;
    const best = ranked.find((t) => t.goals.includes(g) && !chosen.includes(t));
    if (best) chosen.push(best);
  }
  // Second pass: fill up with the next best tools that match a goal.
  for (const t of ranked) {
    if (chosen.length >= count) break;
    if (chosen.includes(t)) continue;
    if (a.goals.length && !t.goals.some((g) => a.goals.includes(g))) continue;
    if (!fitsProfession(t, a.prof)) continue;
    chosen.push(t);
  }

  return chosen
    .sort((x, y) => score(y) - score(x))
    .slice(0, count)
    .map((tool) => {
      const reasons = tool.goals.filter((g) => a.goals.includes(g)).map(goalLabel);
      if (tool.prof.includes(a.prof)) reasons.push(`Built for ${profLabel(a.prof).toLowerCase()}`);
      return { tool, reasons };
    });
}

export function searchTools(
  query: string,
  cat: string,
  price: string,
  list: Tool[] = tools,
  stats?: Stats,
): Tool[] {
  const q = query.trim().toLowerCase();
  return list
    .filter((t) => !cat || t.cat === cat)
    .filter((t) => !price || t.price === price)
    .filter(
      (t) =>
        !q ||
        [t.name, t.maker, t.cat, t.blurb, ...t.goals].some((s) => s.toLowerCase().includes(q)),
    )
    .sort((a, b) => scoreOf(b, stats) - scoreOf(a, stats) || a.name.localeCompare(b.name));
}

export const categoriesOf = (list: Tool[]) => [...new Set(list.map((t) => t.cat))].sort();
