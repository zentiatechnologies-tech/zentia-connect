import zentiaLogo from "@/assets/zentia-logo-white.png";

const exploreLinks = [
  { label: "Services", href: "/#services" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/#faq" },
];

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Twitter/X", href: "https://x.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Facebook", href: "https://facebook.com" },
];

export default function Footer() {
  return (
    <footer className="py-16 md:py-20 bg-card border-t border-border/40 relative grain-overlay">
      <div className="container relative z-10">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <img src={zentiaLogo} alt="Zentia Technologies" className="h-[100px] w-auto mb-6" />
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Making AI-powered efficiency the standard for African businesses.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-5">
              Explore
            </h4>
            <div className="space-y-3">
              {exploreLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-foreground hover:text-primary transition-colors duration-200 text-sm"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-5">
              Connect
            </h4>
            <div className="space-y-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-foreground hover:text-primary transition-colors duration-200 text-sm"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Zentia Technologies. All rights reserved.
          </p>
          <a href="mailto:hello@zentiaai.com" className="text-primary text-sm hover:underline">
            hello@zentiaai.com
          </a>
        </div>
      </div>
    </footer>
  );
}
