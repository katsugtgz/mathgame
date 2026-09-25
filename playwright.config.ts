import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://localhost:4189",
  },
  webServer: {
    command: "npm run preview -- --port 4189 --strictPort",
    port: 4189,
    reuseExistingServer: false,
    stdout: "ignore",
  },
  projects: [{ name: "chromium", use: { ...devices["Pixel 7"] } }],
});
