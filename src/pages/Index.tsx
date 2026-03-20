import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import ServicesSection from "@/components/ServicesSection";
import StatsSection from "@/components/StatsSection";
import ValuesSection from "@/components/ValuesSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";

const Index = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onGetInTouch={() => setContactOpen(true)} />
      <HeroSection onGetInTouch={() => setContactOpen(true)} />
      <ProblemSection />
      <ServicesSection onGetInTouch={() => setContactOpen(true)} />
      <StatsSection />
      <ValuesSection />
      <FAQSection />
      <Footer />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
};

export default Index;
