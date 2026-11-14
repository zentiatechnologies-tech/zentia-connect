import { useEffect, useState } from "react";
import { gaConsent, gaId, loadGa, setGaConsent } from "@/lib/ga";

/** Asks once before Google Analytics loads. Shown only when a GA id is set. */
export default function ConsentBanner() {
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    const c = gaConsent();
    if (c === "yes") loadGa();
    else if (c === null) setAsk(true);
  }, []);

  if (!ask) return null;

  const answer = (v: "yes" | "no") => {
    setGaConsent(v);
    setAsk(false);
  };

  return (
    <div className="consent" role="region" aria-label="Analytics choice">
      <p>
        We use Google Analytics to see which pages help visitors. It sets cookies. Is that okay?
      </p>
      <div className="flex shrink-0 gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => answer("yes")}>
          Accept
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => answer("no")}>
          No thanks
        </button>
      </div>
    </div>
  );
}
