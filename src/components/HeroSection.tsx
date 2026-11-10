import PillStack from "@/components/PillStack";
import { BookCallButton, WhatsAppButton } from "@/components/Actions";
import LoopVideo from "@/components/LoopVideo";

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
            <BookCallButton long />
            <WhatsAppButton />
          </div>
        </div>

        <div className="hero-visual">
          <div className="pill pill-media">
            <LoopVideo
              src="/media/hero-story.mp4"
              poster="/media/hero-story.jpg"
              label="A business owner at his desk smiles and gives a thumbs up"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
