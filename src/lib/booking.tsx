import { createContext, lazy, Suspense, useCallback, useContext, useState, type ReactNode } from "react";
import { withSession } from "@/lib/backend";
import { sourceInfo, track } from "@/lib/analytics";

const BookingDialog = lazy(() => import("@/components/BookingDialog"));

type Ctx = { open: (from?: string) => void };
const BookingContext = createContext<Ctx | null>(null);

/** Every "Book a call" button opens the same pop-up through this provider. */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; mounted: boolean }>({ open: false, mounted: false });

  const open = useCallback((from?: string) => {
    track("book_open", from);
    setState({ open: true, mounted: true });
  }, []);

  return (
    <BookingContext.Provider value={{ open }}>
      {children}
      {state.mounted && (
        <Suspense fallback={null}>
          <BookingDialog open={state.open} onOpenChange={(o) => setState((s) => ({ ...s, open: o }))} />
        </Suspense>
      )}
    </BookingContext.Provider>
  );
}

export function useBooking(): Ctx | null {
  return useContext(BookingContext);
}

export type BookingDetails = {
  ref: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  prof: string;
  topic: string;
  message: string;
  when: string;
};

/** Saves the visitor's details as a lead before they pick a time. */
export async function saveBookingLead(d: BookingDetails) {
  const db = await withSession();
  const message = [d.message.trim(), d.when.trim() && `Preferred times: ${d.when.trim()}`]
    .filter(Boolean)
    .join("\n\n");
  const { error } = await db.from("leads").insert({
    kind: "booking",
    ref: d.ref,
    name: d.name.trim(),
    email: d.email.trim(),
    contact: (d.phone.trim() || d.email.trim()).slice(0, 160),
    company: d.company.trim() || null,
    prof: d.prof || null,
    topic: d.topic || null,
    message: message || null,
    source: sourceInfo(),
  });
  if (error) throw error;
}
