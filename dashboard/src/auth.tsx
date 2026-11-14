import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import logo from "@/assets/zentia-logo-white-trim.png";
import { db, rpc } from "@d/lib/db";

type Who = { admin: boolean; user_id: string | null };
type Ctx = { session: Session; email: string; signOut: () => Promise<void> };
const AuthContext = createContext<Ctx | null>(null);

export function useAuth() {
  return useContext(AuthContext)!;
}

/** Shows the login screen until an approved admin is signed in. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [who, setWho] = useState<Who | null>(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = db.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setWho(null);
    if (session) rpc<Who>("dash_whoami").then(setWho).catch(() => setWho({ admin: false, user_id: session.user.id }));
  }, [session]);

  const signOut = async () => {
    await db.auth.signOut();
  };

  if (session === undefined || (session && !who && !recovering)) {
    return <Screen><p className="text-white/70">Loading…</p></Screen>;
  }
  if (session && recovering) return <NewPassword done={() => setRecovering(false)} />;
  if (!session) return <Login />;
  if (!who?.admin) {
    return (
      <Screen>
        <h1 className="text-2xl font-bold">Waiting for access</h1>
        <p className="mt-3 text-white/75">
          You're signed in as <strong className="text-white">{session.user.email}</strong>, but this account hasn't
          been approved for the dashboard yet.
        </p>
        <p className="mt-3 text-white/75">Send this account ID to whoever manages the dashboard:</p>
        <code className="mt-2 block break-all rounded-xl bg-white/10 px-3 py-2 text-sm">{session.user.id}</code>
        <div className="mt-6 flex gap-3">
          <button type="button" className="d-btn d-btn-primary" onClick={() => window.location.reload()}>
            Check again
          </button>
          <button type="button" className="d-btn border border-white/30" onClick={signOut}>
            Sign out
          </button>
        </div>
      </Screen>
    );
  }
  return (
    <AuthContext.Provider value={{ session, email: session.user.email ?? "", signOut }}>{children}</AuthContext.Provider>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "hsl(var(--zentia-navy-deep))" }}>
      <div className="w-full max-w-[440px] text-white">
        <img src={logo} alt="Zentia" width={880} height={255} className="mb-8 h-10 w-auto" />
        {children}
      </div>
    </main>
  );
}

const field = "d-input !border-white/20 !bg-white/5 !text-white placeholder:text-white/40";

function Login() {
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const redirectTo = window.location.origin + window.location.pathname;
    const res =
      mode === "in"
        ? await db.auth.signInWithPassword({ email, password })
        : mode === "up"
          ? await db.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
          : await db.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (res.error) return setMsg({ ok: false, text: res.error.message });
    if (mode === "up" && !("session" in res.data && res.data.session))
      setMsg({ ok: true, text: "Check your inbox and click the confirmation link, then sign in here." });
    if (mode === "reset") setMsg({ ok: true, text: "If that email has an account, a reset link is on its way." });
  };

  return (
    <Screen>
      <h1 className="text-[1.75rem] font-bold">
        {mode === "in" ? "Sign in to the dashboard" : mode === "up" ? "Create your account" : "Reset your password"}
      </h1>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="d-label text-white">
          Email
          <input className={field} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== "reset" && (
          <label className="d-label text-white">
            Password
            <input
              className={field}
              type="password"
              required
              minLength={mode === "up" ? 10 : 6}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "up" && <span className="font-normal text-white/60">At least 10 characters.</span>}
          </label>
        )}
        <button type="submit" className="d-btn d-btn-primary mt-2" disabled={busy}>
          {busy ? "Please wait" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
        </button>
        {msg && (
          <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-[hsl(160_80%_70%)]" : "text-[hsl(0_90%_78%)]"}>
            {msg.text}
          </p>
        )}
      </form>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
        {mode !== "in" && <button type="button" className="d-link" onClick={() => setMode("in")}>Sign in</button>}
        {mode !== "up" && <button type="button" className="d-link" onClick={() => setMode("up")}>First time? Create an account</button>}
        {mode !== "reset" && <button type="button" className="d-link" onClick={() => setMode("reset")}>Forgot password</button>}
      </div>
    </Screen>
  );
}

function NewPassword({ done }: { done: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await db.auth.updateUser({ password });
    if (error) setErr(error.message);
    else done();
  };
  return (
    <Screen>
      <h1 className="text-[1.75rem] font-bold">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="d-label text-white">
          New password
          <input className={field} type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" className="d-btn d-btn-primary">Save password</button>
        {err && <p role="alert" className="text-[hsl(0_90%_78%)]">{err}</p>}
      </form>
    </Screen>
  );
}
