import { useEffect } from "react";
import { canonical, type PageMeta } from "@/config/seo";

/** Keeps the tab title, description and canonical link right when moving
 *  between pages in the browser. The built HTML already carries them. */
export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", canonical(meta));
    window.scrollTo(0, 0);
  }, [meta]);
}
