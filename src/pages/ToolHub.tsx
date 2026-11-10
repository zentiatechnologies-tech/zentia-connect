import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Search, Star } from "lucide-react";
import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import PillStack from "@/components/PillStack";
import { WhatsAppButton } from "@/components/Actions";
import { usePageMeta } from "@/hooks/usePageMeta";
import { pages } from "@/config/seo";
import { site } from "@/config/site";
import {
  backendEnabled,
  loadHub,
  rateTool,
  requestConsult,
  suggestTool,
  type HubData,
} from "@/lib/toolhub/api";
import {
  bestPicks,
  budgets,
  categoriesOf,
  comfortLevels,
  fitsProfession,
  goals,
  levelLabel,
  priceLabel,
  professions,
  profLabel,
  recommend,
  scoreOf,
  searchTools,
  tools as builtInTools,
  type Answers,
  type Stats,
  type Tool,
} from "@/lib/toolhub/model";

const MAX_GOALS = 3;
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function ToolHub() {
  usePageMeta(pages.tools);

  // Live data. The page starts from the built-in catalog and, when the
  // backend is connected, swaps in the live tools, ratings and nightly picks.
  const [hub, setHub] = useState<HubData | null>(null);
  useEffect(() => {
    if (!backendEnabled) return;
    loadHub()
      .then((data) => {
        setHub(data);
        setRankStats(data.stats);
      })
      .catch(() => {});
  }, []);
  const tools = hub?.tools ?? builtInTools;
  // `stats` updates the moment you rate; `rankStats` is fixed at page load so
  // cards don't jump around while someone is rating them.
  const stats: Stats | undefined = hub?.stats;
  const [rankStats, setRankStats] = useState<Stats | undefined>();
  const categories = useMemo(() => categoriesOf(tools), [tools]);

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
  const shortlist = useMemo(
    () => (answers ? recommend(answers, 6, tools, rankStats) : []),
    [answers, tools, rankStats],
  );

  const build = () => {
    setAnswers({ prof, goals: picked, comfort, budget });
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // Best picks
  const [board, setBoard] = useState("retail");
  const picks = useMemo(() => {
    const nightly = (hub?.picks[board] ?? [])
      .map((id) => tools.find((t) => t.id === id))
      .filter((t): t is Tool => Boolean(t));
    return nightly.length ? nightly : bestPicks(board, 5, tools, rankStats);
  }, [board, hub?.picks, tools, rankStats]);

  // Directory
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [price, setPrice] = useState("");
  const [forProf, setForProf] = useState("");
  const [showAll, setShowAll] = useState(false);
  const found = useMemo(
    () =>
      searchTools(query, cat, price, tools, rankStats).filter(
        (t) => !forProf || fitsProfession(t, forProf),
      ),
    [query, cat, price, forProf, tools, rankStats],
  );
  const filtering = query !== "" || cat !== "" || price !== "" || forProf !== "";
  const visible = showAll || filtering ? found : found.slice(0, 9);

  const toolkitMessage = answers
    ? `Hi Zentia, I used the Tool Hub (${profLabel(answers.prof)}). My shortlist: ${shortlist
        .map((p) => p.tool.name)
        .join(", ")}. I'd like help setting these up.`
    : undefined;

  // Ratings: update the screen straight away, then save.
  const rate = (tool: Tool, stars: number) => {
    const ratedAs = prof || null;
    setHub((cur) => {
      const base: HubData = cur ?? { tools: null, stats: {}, picks: {}, mine: {} };
      const before = base.mine[tool.id];
      const old = base.stats[tool.id] ?? { votes: 0, total: 0, byProf: {} };
      const next = {
        ...old,
        votes: old.votes + (before ? 0 : 1),
        total: old.total + stars - (before ?? 0),
      };
      return {
        ...base,
        mine: { ...base.mine, [tool.id]: stars },
        stats: { ...base.stats, [tool.id]: next },
      };
    });
    rateTool(tool.id, stars, ratedAs).catch(() => {});
  };
  const ratingProps = (t: Tool) =>
    backendEnabled
      ? { mine: hub?.mine[t.id], votes: stats?.[t.id]?.votes ?? 0, onRate: (n: number) => rate(t, n) }
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
                        <ToolCard
                          key={p.tool.id}
                          tool={p.tool}
                          score={scoreOf(p.tool, stats, answers.prof)}
                          prof={answers.prof}
                          reasons={p.reasons}
                          rating={ratingProps(p.tool)}
                        />
                      ))}
                    </div>
                    <LearningPlan picks={shortlist.map((p) => p.tool)} />
                    {backendEnabled ? (
                      <ConsultForm prof={answers.prof} toolkit={shortlist.map((p) => p.tool.id)} />
                    ) : (
                      <div className="mt-8 flex flex-wrap items-center gap-4">
                        <WhatsAppButton onLight label="Get help setting these up" message={toolkitMessage} />
                      </div>
                    )}
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
                  <span className="score">{scoreOf(t, stats, board).toFixed(1)}</span>
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
            Scores start from Zentia's own vetting score out of 5{backendEnabled ? " and move with visitor ratings; ratings from people in the same profession count double" : ""}. Tools built for a
            profession rank ahead of general-purpose ones on that profession's board.
          </p>
        </div>
      </section>

      {/* Directory */}
      <section id="directory" className="section section-light">
        <div className="wrap">
          <h2 className="h2">All {tools.length} tools.</h2>

          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_210px_190px]">
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
              <span className="sr-only">Profession</span>
              <select value={forProf} onChange={(e) => setForProf(e.target.value)}>
                <option value="">All professions</option>
                {professions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
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
              <ToolCard key={t.id} tool={t} score={scoreOf(t, stats)} rating={ratingProps(t)} />
            ))}
          </div>

          <p className="mt-8 text-slate">
            Tools are vetted by Zentia{backendEnabled ? " and rated by the community" : ""}. Always check pricing and data
            rules before you commit.
          </p>

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
          {backendEnabled ? (
            <SuggestForm prof={prof || null} />
          ) : (
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
          )}
        </div>
      </section>

      <CTASection />
    </Layout>
  );
}

type RatingProps = { mine?: number; votes: number; onRate: (stars: number) => void };

function ToolCard({
  tool: t,
  score,
  prof,
  reasons,
  rating,
}: {
  tool: Tool;
  score: number;
  prof?: string;
  reasons?: string[];
  rating?: RatingProps;
}) {
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
          {score.toFixed(1)}
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
        {t.trusted && <span className="tag-trusted">Zentia trusted</span>}
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

      {rating && (
        <div className="rate">
          <span id={`rate-${t.id}`}>{rating.mine ? "Your rating" : "Rate it"}</span>
          <div role="group" aria-labelledby={`rate-${t.id}`} className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                aria-pressed={rating.mine === n}
                data-on={(rating.mine ?? 0) >= n}
                onClick={() => rating.onRate(n)}
              >
                <Star size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
          {rating.votes > 0 && (
            <span className="ml-auto">
              {rating.votes} rating{rating.votes > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <a href={t.url} className="btn btn-outline-dark btn-sm mt-5 self-start" {...ext}>
        Visit {t.name}
        <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </article>
  );
}

const PLAN_KEY = "zentia-toolhub-plan";

/** Three weeks, two tools a week, then a fourth week to join them up.
 *  Ticks are remembered on this device only. */
function LearningPlan({ picks }: { picks: Tool[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setDone(JSON.parse(window.localStorage.getItem(PLAN_KEY) ?? "{}"));
    } catch {
      /* storage unavailable: the plan still works, it just won't be remembered */
    }
  }, []);

  const toggle = (id: string) =>
    setDone((cur) => {
      const next = { ...cur, [id]: !cur[id] };
      try {
        window.localStorage.setItem(PLAN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const weeks = [picks.slice(0, 2), picks.slice(2, 4), picks.slice(4, 6)].filter((w) => w.length);
  const finished = picks.filter((t) => done[t.id]).length;

  return (
    <div className="plan">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="h3">Your {weeks.length}-week learning plan</h3>
        <p className="text-slate" aria-live="polite">
          {finished} of {picks.length} tools started
        </p>
      </div>
      <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {weeks.map((week, i) => (
          <li key={i} className="plan-week">
            <h4>Week {i + 1}</h4>
            {week.map((t) => (
              <label key={t.id} className="plan-item">
                <input type="checkbox" checked={Boolean(done[t.id])} onChange={() => toggle(t.id)} />
                <span>
                  <strong>{t.name}</strong>
                  {t.steps[0]}
                </span>
              </label>
            ))}
          </li>
        ))}
        <li className="plan-week plan-week-last">
          <h4>Week {weeks.length + 1}</h4>
          <label className="plan-item">
            <input type="checkbox" checked={Boolean(done._workflow)} onChange={() => toggle("_workflow")} />
            <span>
              <strong>Connect them</strong>
              Pick one task you do every week and run it through your new tools from start to
              finish.
            </span>
          </label>
        </li>
      </ol>
    </div>
  );
}

type FormState = "idle" | "sending" | "sent" | "error";

function ConsultForm({ prof, toolkit }: { prof: string; toolkit: string[] }) {
  const [state, setState] = useState<FormState>("idle");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      await requestConsult({
        name: String(f.get("name")),
        contact: String(f.get("contact")),
        message: String(f.get("message") ?? ""),
        prof,
        toolkit,
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <p className="form-done" role="status">
        Thank you. We have your request and will be in touch within two working days.
      </p>
    );
  }

  return (
    <form className="hub-form mt-10" onSubmit={submit}>
      <h3 className="h3">Want help setting these up?</h3>
      <p className="mt-2 text-slate">
        Leave your details and we'll contact you about this shortlist. Free, no obligation.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="form-field">
          <span>Your name</span>
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" />
        </label>
        <label className="form-field">
          <span>Phone, WhatsApp or email</span>
          <input name="contact" required minLength={5} maxLength={160} />
        </label>
        <label className="form-field md:col-span-2">
          <span>Anything we should know? (optional)</span>
          <textarea name="message" rows={3} maxLength={1500} />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending" : "Request a consult"}
        </button>
        {state === "error" && (
          <p className="form-error" role="alert">
            That didn't send. Please try again, or email {site.email}.
          </p>
        )}
      </div>
    </form>
  );
}

function SuggestForm({ prof }: { prof: string | null }) {
  const [state, setState] = useState<FormState>("idle");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      await suggestTool({
        tool_name: String(f.get("tool_name")),
        url: String(f.get("url") ?? ""),
        note: String(f.get("note") ?? ""),
        prof,
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <p className="form-done form-done-dark" role="status">
        Thank you. We'll test it and add it if it earns a place.
      </p>
    );
  }

  return (
    <form className="hub-form hub-form-dark" onSubmit={submit}>
      <div className="grid gap-4">
        <label className="form-field">
          <span>Tool name</span>
          <input name="tool_name" required minLength={2} maxLength={120} />
        </label>
        <label className="form-field">
          <span>Website (optional)</span>
          <input name="url" type="url" maxLength={300} placeholder="https://" />
        </label>
        <label className="form-field">
          <span>What do you use it for? (optional)</span>
          <textarea name="note" rows={3} maxLength={1000} />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending" : "Suggest this tool"}
        </button>
        {state === "error" && (
          <p className="form-error" role="alert">
            That didn't send. Please try again, or email {site.email}.
          </p>
        )}
      </div>
    </form>
  );
}
