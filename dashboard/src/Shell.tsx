import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import logo from "@/assets/zentia-logo-white-trim.png";
import { useAuth } from "@d/auth";
import { Seg } from "@d/ui";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/traffic", label: "Traffic", icon: BarChart3 },
  { to: "/tool-hub", label: "Tool Hub", icon: Wrench },
  { to: "/seo", label: "SEO & changes", icon: Search },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export type Range = { days: number; from: string; to: string; prevFrom: string; prevTo: string };
const RangeContext = createContext<{ range: Range; setDays: (d: number) => void } | null>(null);

export function useRange() {
  return useContext(RangeContext)!;
}

function makeRange(days: number): Range {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  const prevFrom = new Date(from.getTime() - days * 86400000);
  return { days, from: from.toISOString(), to: to.toISOString(), prevFrom: prevFrom.toISOString(), prevTo: from.toISOString() };
}

export function RangePicker() {
  const { range, setDays } = useRange();
  return (
    <Seg
      label="Date range"
      value={range.days}
      onChange={setDays}
      options={[
        { value: 7, label: "7 days" },
        { value: 30, label: "30 days" },
        { value: 90, label: "90 days" },
      ]}
    />
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const { email, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [days, setDaysState] = useState(() => Number(localStorage.getItem("zd_days")) || 30);
  const range = useMemo(() => makeRange(days), [days]);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  const setDays = (d: number) => {
    localStorage.setItem("zd_days", String(d));
    setDaysState(d);
  };

  return (
    <RangeContext.Provider value={{ range, setDays }}>
      <div className="d-shell">
        <aside className="d-side">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Zentia" width={880} height={255} className="h-8 w-auto lg:h-9" />
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/80">Dashboard</span>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav className={`d-nav ${open ? "d-nav-open" : ""}`} aria-label="Dashboard">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
                <Icon size={19} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            <div className="mt-4 border-t border-white/10 pt-4 lg:mt-auto">
              <p className="truncate px-4 text-sm text-white/60" title={email}>
                {email}
              </p>
              <button type="button" onClick={signOut} className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-full px-4 text-white/75 hover:bg-white/5 hover:text-white">
                <LogOut size={19} aria-hidden="true" /> Sign out
              </button>
            </div>
          </nav>
        </aside>
        <main className="d-main">{children}</main>
      </div>
    </RangeContext.Provider>
  );
}
