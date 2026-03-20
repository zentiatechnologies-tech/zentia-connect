import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, Mail } from "lucide-react";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
              href="mailto:zentiatechnologies@gmail.com"
              className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors"
            >
              <Mail size={16} className="text-primary" />
              zentiatechnologies@gmail.com
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
