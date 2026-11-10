import { Link } from "react-router-dom";
import logo from "@/assets/zentia-logo-white-trim.png";
import { site, whatsappLink } from "@/config/site";

const explore = [
  { label: "Services", href: "/#services" },
  { label: "Workshops", href: "/#workshops" },
  { label: "How we work", href: "/#process" },
  { label: "About", href: "/about/" },
  { label: "Resources", href: "/resources/" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <Link to="/" aria-label="Zentia Technologies home">
            <img src={logo} alt="Zentia Technologies" width={880} height={255} className="h-10 w-auto" loading="lazy" />
          </Link>
          <p className="mt-5 max-w-xs text-white/70">
            AI consulting, custom builds and training for African businesses. Based in Kampala, Uganda.
          </p>
        </div>

        <div>
          <h2 className="footer-head">Explore</h2>
          <ul className="space-y-2.5">
            {explore.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="footer-link">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="footer-head">Contact</h2>
          <ul className="space-y-2.5">
            <li>
              <a href={`mailto:${site.email}`} className="footer-link">
                {site.email}
              </a>
            </li>
            <li>
              <a href={site.phoneHref} className="footer-link">
                {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="footer-link">
                WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="footer-head">Follow</h2>
          <ul className="space-y-2.5">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="footer-link">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="wrap mt-12 border-t border-white/10 pt-6 text-sm text-white/60">
        © {new Date().getFullYear()} Zentia Technologies. All rights reserved.
      </div>
    </footer>
  );
}
