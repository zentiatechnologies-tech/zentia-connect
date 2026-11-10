import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/zentia-logo-white-trim.png";
import { BookCallButton } from "@/components/Actions";

const links = [
  { label: "Services", href: "/#services" },
  { label: "How we work", href: "/#process" },
  { label: "Tool Hub", href: "/tools/" },
  { label: "About", href: "/about/" },
  { label: "Resources", href: "/resources/" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav">
      <div className="wrap flex h-[72px] items-center justify-between gap-6">
        <Link to="/" className="shrink-0" aria-label="Zentia Technologies home">
          <img src={logo} alt="Zentia Technologies" width={880} height={255} className="h-9 w-auto md:h-10" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <BookCallButton className="btn-sm hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="icon-btn lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="wrap border-t border-white/10 pb-6 pt-2 lg:hidden" aria-label="Mobile">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="nav-link block py-3 text-base">
              {l.label}
            </a>
          ))}
          <BookCallButton className="mt-3 w-full sm:hidden" />
        </nav>
      )}
    </header>
  );
}
