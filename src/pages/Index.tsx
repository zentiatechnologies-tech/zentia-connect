import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import ServicesSection from "@/components/ServicesSection";
import WorkshopSection from "@/components/WorkshopSection";
import ProcessSection from "@/components/ProcessSection";
import ToolHubSection from "@/components/ToolHubSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import { usePageMeta } from "@/hooks/usePageMeta";
import { pages } from "@/config/seo";

export default function Index() {
  usePageMeta(pages.home);
  return (
    <Layout>
      <HeroSection />
      <ProblemSection />
      <ServicesSection />
      <WorkshopSection />
      <ProcessSection />
      <ToolHubSection />
      <FAQSection />
      <CTASection />
    </Layout>
  );
}
