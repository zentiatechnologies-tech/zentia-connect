import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./dash.css";
import { AuthGate } from "@d/auth";
import Shell from "@d/Shell";
import { Loading } from "@d/ui";

const Overview = lazy(() => import("@d/pages/Overview"));
const Leads = lazy(() => import("@d/pages/Leads"));
const Bookings = lazy(() => import("@d/pages/Bookings"));
const Traffic = lazy(() => import("@d/pages/Traffic"));
const ToolHub = lazy(() => import("@d/pages/ToolHub"));
const Seo = lazy(() => import("@d/pages/Seo"));
const Reports = lazy(() => import("@d/pages/Reports"));
const Settings = lazy(() => import("@d/pages/Settings"));

// Hash routes (#/leads) so the dashboard works from any folder on the host
// without server rewrite rules.
createRoot(document.getElementById("root")!).render(
  <AuthGate>
    <HashRouter>
      <Shell>
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/traffic" element={<Traffic />} />
          <Route path="/tool-hub" element={<ToolHub />} />
          <Route path="/seo" element={<Seo />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Overview />} />
        </Routes>
        </Suspense>
      </Shell>
    </HashRouter>
  </AuthGate>,
);
