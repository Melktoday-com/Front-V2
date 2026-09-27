import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'https://beta.melktoday.ir',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'off',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        channel: 'chrome',
      },
    },
  ],
});
