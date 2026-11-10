import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;
const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Built pages arrive as ready HTML and are hydrated. If the server handed us
// a different page's HTML (or none, as in dev), render from scratch instead.
const here = window.location.pathname.replace(/\/+$/, "") || "/";
if (root.dataset.page === here) {
  hydrateRoot(root, app);
} else {
  root.replaceChildren();
  createRoot(root).render(app);
}
