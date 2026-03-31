import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";

const Resources = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onGetInTouch={() => setContactOpen(true)} />

      <main className="flex-1 pt-24 md:pt-32 pb-20">
        <div className="container">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Resources
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-12">
            Free guides, templates, and tools to help you leverage AI for your business.
          </p>

          <div className="flex items-center justify-center py-20 border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground text-sm">
              Resources coming soon — check back shortly.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
};

export default Resources;
