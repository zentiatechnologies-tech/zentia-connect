import Layout from "@/components/Layout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { pages } from "@/config/seo";

export default function NotFound() {
  usePageMeta(pages.notFound);
  return (
    <Layout>
      <section className="section section-dark flex min-h-[70vh] items-center">
        <div className="wrap pt-20">
          <h1 className="display">This page doesn't exist.</h1>
          <p className="lede mt-5">The link may be old or mistyped.</p>
          <a href="/" className="btn btn-primary mt-8">
            Back to the home page
          </a>
        </div>
      </section>
    </Layout>
  );
}
