import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// NOTE: lovable-tagger has been intentionally removed.
// This config is migration-ready from the Lovable project.

export default defineConfig(({ mode }) => {
  // Load env so VITE_* vars are available at build time
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
    },
    define: {
      // Expose env vars explicitly if needed (they are available via import.meta.env by default)
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  };
});
