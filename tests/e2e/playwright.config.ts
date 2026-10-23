import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3008",
    headless: true,
    ...devices["Pixel 5"],
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
