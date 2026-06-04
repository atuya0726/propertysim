import { defineConfig } from "vite";
import pages from "@hono/vite-cloudflare-pages";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      publicDir: false,
      build: {
        rollupOptions: {
          input: "./src/client.ts",
          output: {
            entryFileNames: "client.js",
            format: "iife",
            name: "PropertySim",
          },
        },
        outDir: "public/assets",
        emptyOutDir: false,
      },
    };
  }

  // Production Cloudflare Pages worker build
  return {
    plugins: [pages()],
  };
});
