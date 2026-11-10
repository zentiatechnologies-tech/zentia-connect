import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, Search } from "lucide-react";
import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import PillStack from "@/components/PillStack";
import { WhatsAppButton } from "@/components/Actions";
import { usePageMeta } from "@/hooks/usePageMeta";
import { pages } from "@/config/seo";
import { site } from "@/config/site";
import {
  bestPicks,
  budgets,
  categories,
  comfortLevels,
  goals,
  levelLabel,
  priceLabel,
  professions,
  profLabel,
  recommend,
  searchTools,
  tools,
  type Answers,
  type Tool,
} from "@/lib/toolhub/model";

const MAX_GOALS = 3;
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function ToolHub() {
  usePageMeta(pages.tools);

  // Questionnaire
  const [prof, setProf] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [comfort, setComfort] = useState(1);
  const [budget, setBudget] = useState<Answers["budget"]>("free");
  const [answers, setAnswers] = useState<Answers | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const toggleGoal = (id: string) =>
    setPicked((cur) =>
      cur.includes(id) ? cur.filter((g) => g !== id) : cur.length < MAX_GOALS ? [...cur, id] : cur,
    );

  const ready = prof !== "" && picked.length > 0;
  const shortlist = useMemo(() => (answers ? recommend(answers) : []), [answers]);

  const build = () => {
    setAnswers({ prof, goals: picked, comfort, budget });
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // Best picks
  const [board, setBoard] = useState("retail");
  const picks = useMemo(() => bestPicks(board), [board]);

  // Directory
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [price, setPrice] = useState("");
  const [showAll, setShowAll] = useState(false);
  const found = useMemo(() => searchTools(query, cat, price), [query, cat, price]);
  const filtering = query !== "" || cat !== "" || price !== "";
  const visible = showAll || filtering ? found : found.slice(0, 9);

  const toolkitMessage = answers
    ? `Hi Zentia, I used the Tool Hub (${profLabel(answers.prof)}). My shortlist: ${shortlist
        .map((p) => p.tool.name)
        .join(", ")}. I'd like help setting these up.`
    : undefined;

  return (
    <Layout>
      <section className="hero hero-short">
        <PillStack className="hero-art" />
        <div className="wrap relative z-10 pb-14 pt-36 md:pb-16 md:pt-44">
          <h1 className="display max-w-3xl">Find the right AI tools for your work.</h1>
          <p className="lede mt-6 max-w-2xl">
            {tools.length} tools vetted by Zentia. Answer four questions and get a shortlist that
            fits your work. Free, no sign-up.
          </p>
          <div className="btn-row mt-9">
            <a href="#toolkit" className="btn btn-primary">
              Build my toolkit
            </a>
            <a href="#directory" className="btn btn-outline">
              Browse all tools
            </a>
          </div>
        </div>
      </section>

      {/* Questionnaire */}
      <section id="toolkit" className="section section-light">
        <div className="wrap">
          <h2 className="h2">Your personal toolkit.</h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <fieldset>
              <legend className="q-label">1. What kind of work do you do?</legend>
              <div className="chip-row">
                {professions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="chip"
                    aria-pressed={prof === p.id}
                    onClick={() => setProf(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="q-label">
                2. What do you want help with? <span className="q-hint">Pick up to {MAX_GOALS}</span>
              </legend>
              <div className="chip-row">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="chip"
                    aria-pressed={picked.includes(g.id)}
                    disabled={!picked.includes(g.id) && picked.length >= MAX_GOALS}
                    onClick={() => toggleGoal(g.id)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="q-label">3. How comfortable are you with tech?</legend>
              <div className="option-row">
                {comfortLevels.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="option"
                    aria-pressed={comfort === c.id}
                    onClick={() => setComfort(c.id)}
                  >
                    <strong>{c.label}</strong>
                    <span>{c.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="q-label">4. What's your budget?</legend>
              <div className="option-row">
                {budgets.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="option"
                    aria-pressed={budget === b.id}
                    onClick={() => setBudget(b.id)}
                  >
                    <strong>{b.label}</strong>
                    <span>{b.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-primary" disabled={!ready} onClick={build}>
              Show my toolkit
            </button>
            {!ready && <p className="text-slate">Choose your work and at least one goal.</p>}
          </div>

          <div ref={resultsRef} className="scroll-mt-24" aria-live="polite">
            {answers && (
              <div className="mt-14">
                <h3 className="h3">
                  {shortlist.length} tools for {profLabel(answers.prof).toLowerCase()}
                </h3>
                {shortlist.length === 0 ? (
                  <p className="mt-4 text-lg text-slate">
                    Nothing in the catalog fits those answers yet. Try a higher comfort level or
                    open the budget.
                  </p>
                ) : (
                  <>
                    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {shortlist.map((p) => (
                        <ToolCard key={p.tool.id} tool={p.tool} prof={answers.prof} reasons={p.reasons} />
                      ))}
                    </div>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <WhatsAppButton onLight label="Get help setting these up" message={toolkitMessage} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Best picks */}
      <section id="best-picks" className="section section-dark">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h2 className="h2">Best picks by profession.</h2>
            <label className="field-dark">
              <span className="sr-only">Profession</span>
              <select value={board} onChange={(e) => setBoard(e.target.value)}>
                {professions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ol className="mt-10 space-y-3">
            {picks.map((t, i) => (
              <li key={t.id} className="pick-row">
                <span className="step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold">{t.name}</h3>
                  <p className="mt-1 text-white/75">{t.uses[board] ?? t.blurb}</p>
                </div>
                <div className="pick-meta">
                  <span className="score">{t.editor.toFixed(1)}</span>
                  <span className="text-white/60">{priceLabel[t.price]}</span>
                </div>
                <a href={t.url} className="text-link shrink-0" {...ext}>
                  Visit <span className="sr-only">{t.name}</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-white/60">
            Scores are Zentia's own vetting score out of 5. Tools built for a profession rank ahead
            of general-purpose ones on that profession's board.
          </p>
        </div>
      </section>

      {/* Directory */}
      <section id="directory" className="section section-light">
        <div className="wrap">
          <h2 className="h2">All {tools.length} tools.</h2>

          <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_200px]">
            <label className="field">
              <span className="sr-only">Search tools</span>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by name or task"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="sr-only">Category</span>
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="sr-only">Price</span>
              <select value={price} onChange={(e) => setPrice(e.target.value)}>
                <option value="">Any price</option>
                <option value="free">Free</option>
                <option value="freemium">Free plan available</option>
                <option value="paid">Paid</option>
              </select>
            </label>
          </div>

          <p className="mt-5 text-slate" aria-live="polite">
            {filtering ? `${found.length} of ${tools.length} tools match.` : "Sorted by Zentia score."}
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>

          {!filtering && !showAll && (
            <button type="button" className="btn btn-outline-dark mt-8" onClick={() => setShowAll(true)}>
              Show all {tools.length} tools
            </button>
          )}
        </div>
      </section>

      {/* Contribute */}
      <section id="contribute" className="section section-deep">
        <div className="wrap grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="h2">Know a tool we should add?</h2>
            <p className="lede mt-4">
              Tell us what it is and how you use it. We test every suggestion before it joins the
              catalog.
            </p>
          </div>
          <div className="btn-row lg:items-center lg:justify-end">
            <a
              className="btn btn-primary"
              href={`mailto:${site.email}?subject=${encodeURIComponent("Tool Hub suggestion")}&body=${encodeURIComponent(
                "Tool name:\nWebsite:\nWhat I use it for:\nMy line of work:\n",
              )}`}
            >
              Suggest a tool by email
            </a>
            <WhatsAppButton
              label="Suggest on WhatsApp"
              message="Hi Zentia, I'd like to suggest a tool for the Tool Hub: "
            />
          </div>
        </div>
      </section>

      <CTASection />
    </Layout>
  );
}

function ToolCard({ tool: t, prof, reasons }: { tool: Tool; prof?: string; reasons?: string[] }) {
  const use = prof ? t.uses[prof] : undefined;
  const video = t.yt
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(t.yt)}`
    : undefined;

  return (
    <article className="tool">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-snug text-navy">{t.name}</h3>
          <p className="text-slate">
            {t.cat}, by {t.maker}
          </p>
        </div>
        <span className="score score-light" title="Zentia score out of 5">
          {t.editor.toFixed(1)}
        </span>
      </div>

      <p className="mt-4 text-navy">{use ?? t.blurb}</p>

      {reasons && reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {reasons.map((r) => (
            <li key={r} className="flex gap-2 text-slate">
              <Check size={18} className="mt-0.5 shrink-0 text-green-dark" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      )}

      <p className="tool-tags">
        <span>{priceLabel[t.price]}</span>
        <span>{levelLabel[t.level]}</span>
      </p>

      <details className="tool-more">
        <summary>How to start</summary>
        <ol>
          {t.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {t.africa && <p className="tool-note">{t.africa}</p>}
        <p className="tool-links">
          {video && (
            <a href={video} {...ext}>
              Watch a tutorial
            </a>
          )}
          {t.learn?.map((l) => (
            <a key={l.url} href={l.url} {...ext}>
              {l.label}
            </a>
          ))}
        </p>
      </details>

      <a href={t.url} className="btn btn-outline-dark btn-sm mt-5 self-start" {...ext}>
        Visit {t.name}
        <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </article>
  );
}
