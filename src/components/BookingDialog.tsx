import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, CalendarCheck, X } from "lucide-react";
import { offers, site, whatsappLink } from "@/config/site";
import { professions } from "@/lib/toolhub/model";
import { backendEnabled } from "@/lib/backend";
import { track } from "@/lib/analytics";
import { saveBookingLead, type BookingDetails } from "@/lib/booking";
import { showCalendar } from "@/lib/cal";
import { WhatsAppIcon } from "@/components/Actions";

type Step = "details" | "calendar" | "done" | "sent";

const topics = [...offers.map((o) => ({ id: o.slug, label: o.name })), { id: "unsure", label: "Not sure yet" }];

const empty: BookingDetails = {
  ref: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  prof: "",
  topic: "audit",
  message: "",
  when: "",
};

export default function BookingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [step, setStep] = useState<Step>("details");
  const [d, setD] = useState<BookingDetails>(empty);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [savedRef, setSavedRef] = useState("");
  const calRef = useRef<HTMLDivElement>(null);
  const hasCal = Boolean(site.calLink);

  // A closed and reopened pop-up starts again unless they were mid-booking.
  useEffect(() => {
    if (open && (step === "done" || step === "sent")) {
      setStep("details");
      setD((p) => ({ ...p, ref: "", message: "", when: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (step !== "calendar" || !calRef.current) return;
    const notes = [
      `Company: ${d.company || "-"}`,
      `Industry: ${professions.find((p) => p.id === d.prof)?.label ?? "-"}`,
      `Interested in: ${topics.find((t) => t.id === d.topic)?.label ?? "-"}`,
      d.phone && `Phone/WhatsApp: ${d.phone}`,
      d.message && `\n${d.message}`,
    ]
      .filter(Boolean)
      .join("\n");
    showCalendar(calRef.current, site.calLink, { name: d.name, email: d.email, notes, ref: d.ref }, () => {
      track("book_done", d.topic);
      setStep("done");
    });
  }, [step, d]);

  const set = (k: keyof BookingDetails) => (e: { target: { value: string } }) =>
    setD((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const details = { ...d, ref: d.ref || crypto.randomUUID() };
    setD(details);
    setSending(true);
    setError(false);
    let saved = savedRef === details.ref;
    if (backendEnabled && !saved) {
      try {
        await saveBookingLead(details);
        setSavedRef(details.ref);
        saved = true;
      } catch {
        saved = false;
      }
    }
    setSending(false);
    if (hasCal) {
      // Never block the booking itself on our own database.
      track("book_details", details.topic);
      setStep("calendar");
    } else if (saved && backendEnabled) {
      track("book_details", details.topic);
      setStep("sent");
    } else {
      setError(true);
    }
  };

  const wide = step === "calendar";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="book-overlay" />
        <Dialog.Content className={`book-dialog ${wide ? "book-dialog-wide" : ""}`} aria-describedby="book-desc">
          <div className="book-head">
            {step === "calendar" ? (
              <button type="button" className="book-back" onClick={() => setStep("details")}>
                <ArrowLeft size={18} aria-hidden="true" /> Edit details
              </button>
            ) : (
              <span className="book-steps" aria-hidden="true">
                {step === "details" ? (hasCal ? "Step 1 of 2" : "") : ""}
              </span>
            )}
            <Dialog.Close className="book-close" aria-label="Close">
              <X size={22} />
            </Dialog.Close>
          </div>

          {step === "details" && (
            <form onSubmit={submit} className="book-body">
              <Dialog.Title className="h3">Book a free 20-minute AI readiness call</Dialog.Title>
              <Dialog.Description id="book-desc" className="mt-2 text-slate">
                Tell us a little about your business so we come prepared.
                {hasCal ? " Then pick a time that suits you." : " We'll reply within one working day to fix a time."}
              </Dialog.Description>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="form-field">
                  <span>Your name</span>
                  <input value={d.name} onChange={set("name")} required minLength={2} maxLength={120} autoComplete="name" />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <input type="email" value={d.email} onChange={set("email")} required maxLength={160} autoComplete="email" />
                </label>
                <label className="form-field">
                  <span>Business name</span>
                  <input value={d.company} onChange={set("company")} required minLength={2} maxLength={160} autoComplete="organization" />
                </label>
                <label className="form-field">
                  <span>
                    Phone or WhatsApp <span className="font-normal text-slate">(optional)</span>
                  </span>
                  <input type="tel" value={d.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" />
                </label>
                <label className="form-field">
                  <span>Your industry</span>
                  <select value={d.prof} onChange={set("prof")} required>
                    <option value="" disabled>
                      Choose one
                    </option>
                    {professions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                    <option value="other">Something else</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>What would you like help with?</span>
                  <select value={d.topic} onChange={set("topic")}>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field sm:col-span-2">
                  <span>
                    What's taking up your team's time? <span className="font-normal text-slate">(optional)</span>
                  </span>
                  <textarea value={d.message} onChange={set("message")} rows={3} maxLength={1200} />
                </label>
                {!hasCal && (
                  <label className="form-field sm:col-span-2">
                    <span>
                      Good days and times for a call <span className="font-normal text-slate">(optional)</span>
                    </span>
                    <input value={d.when} onChange={set("when")} maxLength={200} placeholder="e.g. weekday mornings" />
                  </label>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? "Saving" : hasCal ? "Next: pick a time" : "Request my call"}
                  {!sending && <ArrowRight size={18} aria-hidden="true" />}
                </button>
                <a
                  href={whatsappLink("Hi Zentia, I'd like to book a free 20-minute AI readiness call.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="book-wa"
                >
                  <WhatsAppIcon size={18} /> Prefer WhatsApp?
                </a>
              </div>
              {error && (
                <p className="form-error mt-3" role="alert">
                  That didn't send. Please try again, message us on WhatsApp, or email {site.email}.
                </p>
              )}
              <p className="mt-4 text-sm text-slate">
                We only use these details to prepare for your call and to contact you about it.
              </p>
            </form>
          )}

          {step === "calendar" && (
            <div className="book-body book-body-cal">
              <Dialog.Title className="sr-only">Pick a time for your call</Dialog.Title>
              <Dialog.Description id="book-desc" className="sr-only">
                Choose a day and time. A calendar invite will be emailed to {d.email}.
              </Dialog.Description>
              <div ref={calRef} className="book-cal" data-testid="cal-inline" />
            </div>
          )}

          {(step === "done" || step === "sent") && (
            <div className="book-body book-done" role="status">
              <CalendarCheck size={44} className="text-[hsl(160_99%_30%)]" aria-hidden="true" />
              <Dialog.Title className="h3 mt-4">
                {step === "done" ? "You're booked." : "Thank you. We have your request."}
              </Dialog.Title>
              <Dialog.Description id="book-desc" className="mt-3 text-lg text-slate">
                {step === "done"
                  ? `A calendar invite is on its way to ${d.email}. We look forward to speaking with you.`
                  : `We'll contact you within one working day to confirm a time. Want it sooner? Message us on WhatsApp.`}
              </Dialog.Description>
              <div className="mt-6 flex flex-wrap gap-3">
                <Dialog.Close className="btn btn-primary">Done</Dialog.Close>
                {step === "sent" && (
                  <a
                    href={whatsappLink("Hi Zentia, I just requested a free 20-minute AI readiness call.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-dark"
                  >
                    <WhatsAppIcon /> WhatsApp us
                  </a>
                )}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
