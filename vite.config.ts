import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
        icons: [], // ponytail: add 192/512 maskable icons before first deploy
      },
    }),
  ],
  test: {
    environment: "node",
  },
});
