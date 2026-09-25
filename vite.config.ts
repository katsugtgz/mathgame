import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/mathgame/", // GitHub Pages project path
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // ponytail: workbox defaults (precache all assets) fine until app grows;
      // add runtimeCaching only if remote assets ever appear
      manifest: {
        name: "MathGame — Latihan Matematika Harian",
        short_name: "MathGame",
        description:
          "Latihan matematika harian untuk kelas 4-6. Metode Kumon + CPA, bisa dipakai offline.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#fffbeb",
        theme_color: "#f59e0b",
        lang: "id",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**"],
      exclude: ["src/engine/types.ts"], // type-only, tanpa runtime
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
