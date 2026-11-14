import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsentBanner from "@/components/ConsentBanner";
import { WhatsAppFab } from "@/components/Actions";
import { BookingProvider } from "@/lib/booking";
import { pageview } from "@/lib/analytics";

function PageviewListener() {
  const { pathname } = useLocation();
  useEffect(() => {
    pageview();
  }, [pathname]);
  return null;
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <BookingProvider>
      <PageviewListener />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppFab />
      <ConsentBanner />
    </BookingProvider>
  );
}
