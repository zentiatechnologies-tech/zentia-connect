import { Link } from "react-router-dom";
import PillStack from "@/components/PillStack";
import { BookCallButton, WhatsAppButton } from "@/components/Actions";
import heroPhoto from "@/assets/visuals/hero-relieved.jpg";

export default function HeroSection() {
  return (
    <section className="hero">
      <PillStack className="hero-art" />

      <div className="wrap relative z-10 grid items-center gap-10 pb-16 pt-28 md:pt-32 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pb-20">
        <div>
          <h1 className="display">Put AI to work in your business.</h1>
          <p className="lede mt-6 max-w-xl">
            Zentia helps African businesses find where AI saves time and money, builds it, and trains
            your team to run it.
          </p>
          <div className="btn-row mt-9">
            <BookCallButton long from="hero" />
            <WhatsAppButton />
          </div>
          <p className="mt-6 text-white/75">
            Not ready to talk?{" "}
            <Link to="/tools/" className="inline-link">
              Find AI tools for your work in the free Tool Hub
            </Link>
          </p>
        </div>

        <div className="hero-visual">
          <div className="pill pill-media">
            <img
              src={heroPhoto}
              alt="A business owner leaning back at his desk, laughing with relief"
              width={1600}
              height={1066}
              fetchPriority="high"
              className="h-full w-full object-cover object-[30%_center]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
