import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env["NBP_BASE_URL"] ?? "https://near-by-pricesfrontend.vercel.app";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  workers: process.env["CI"] ? 2 : 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "audit-results/playwright-results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: Number(process.env["PLAYWRIGHT_TIMEOUT_MS"] ?? 15000),
    navigationTimeout: Number(process.env["PLAYWRIGHT_TIMEOUT_MS"] ?? 30000),
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env["CHROMIUM_PATH"] ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome",
          args: ["--no-sandbox"],
        },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        launchOptions: {
          executablePath: process.env["CHROMIUM_PATH"] ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome",
          args: ["--no-sandbox"],
        },
      },
    },
  ],
  timeout: 60000,
  outputDir: "test-results",
});
