import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// The Zentia dashboard (dash.zentiaai.com): a separate app with its own build.
export default defineConfig({
  root: path.resolve(__dirname, "dashboard"),
  envDir: __dirname,
  base: "./",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 8081 },
  preview: { host: "127.0.0.1", port: 4174 },
  resolve: {
    alias: {
      "@d": path.resolve(__dirname, "./dashboard/src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist-dashboard"),
    emptyOutDir: true,
  },
});
