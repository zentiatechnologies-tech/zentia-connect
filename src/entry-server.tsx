import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App.tsx";

export { pages, canonical } from "./config/seo";
export { site } from "./config/site";
export { faqs } from "./components/FAQSection";

export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
}
