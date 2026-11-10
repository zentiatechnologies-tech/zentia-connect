import { Route, Routes } from "react-router-dom";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Resources from "./pages/Resources.tsx";
import ToolHub from "./pages/ToolHub.tsx";
import NotFound from "./pages/NotFound.tsx";

/** Routes only. The router itself is supplied by main.tsx in the browser
 *  and by entry-server.tsx when the pages are pre-built to HTML. */
const App = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/about" element={<About />} />
    <Route path="/resources" element={<Resources />} />
    <Route path="/tools" element={<ToolHub />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
