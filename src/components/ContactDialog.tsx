import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, Mail, Twitter, Instagram, Facebook, Linkedin } from "lucide-react";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const socials = [
  { icon: Twitter, href: "https://x.com/ZentiaTech", label: "X/Twitter" },
  { icon: Instagram, href: "https://www.instagram.com/zentiaai/", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61577446617141", label: "Facebook" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/zentia-technologies/", label: "LinkedIn" },
];

export default function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground">
            Tell us more about you
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Fill out our short questionnaire so we can understand your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfeBSzD6KqYEuxTsDnBrLbnBkixy3FRge_bBoty4-N54KvTkg/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="hero" size="lg" className="w-full gap-2 py-5">
              Open Questionnaire <ExternalLink size={16} />
            </Button>
          </a>

          <div className="border-t border-border/40 pt-5 space-y-3">
            <p className="font-heading text-xs uppercase tracking-widest text-muted-foreground">
              Or reach us directly
            </p>
            <a
              href="tel:+256793391078"
              className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
            >
              <Phone size={16} className="text-primary" />
              +256 793 391 078
            </a>
            <a
              href="mailto:info@zentiaai.com"
              className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
            >
              <Mail size={16} className="text-primary" />
              info@zentiaai.com
            </a>
            <a
              href="mailto:zentiatechnologies@gmail.com"
              className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
            >
              <Mail size={16} className="text-primary" />
              zentiatechnologies@gmail.com
            </a>
          </div>

          <div className="border-t border-border/40 pt-5">
            <p className="font-heading text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Follow us
            </p>
            <div className="flex items-center gap-4">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={label}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}