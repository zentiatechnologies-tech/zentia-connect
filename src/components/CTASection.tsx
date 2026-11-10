import glassBlue from "@/assets/visuals/glass-blue.jpg";
import { BookCallButton, WhatsAppButton } from "@/components/Actions";
import { site } from "@/config/site";

export default function CTASection() {
  return (
    <section id="contact" className="cta-band">
      <img src={glassBlue} alt="" aria-hidden="true" className="cta-bg" loading="lazy" />
      <div className="cta-shade" aria-hidden="true" />
      <div className="wrap relative z-10">
        <h2 className="display max-w-3xl">Twenty minutes to find out where AI fits.</h2>
        <p className="lede mt-5 max-w-xl">
          A free call with one of our founders. Tell us how your business runs and we'll tell you
          honestly where AI could help first.
        </p>
        <div className="btn-row mt-9">
          <BookCallButton long />
          <WhatsAppButton />
        </div>
        <p className="mt-8 text-white/80">
          Prefer to write? Email{" "}
          <a className="inline-link" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          , call{" "}
          <a className="inline-link" href={site.phoneHref}>
            {site.phoneDisplay}
          </a>{" "}
          or{" "}
          <a className="inline-link" href={site.questionnaireUrl} target="_blank" rel="noopener noreferrer">
            fill in our short questionnaire
          </a>
          .
        </p>
      </div>
    </section>
  );
}
