import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}/PololasBeautyStudio/`;
// Locally reuse the installed Google Chrome; CI installs Playwright's Chromium.
const channel = process.env.CI ? undefined : 'chrome';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // Navigate with relative paths (`page.goto('catalogo/')`) so the base path is kept.
    baseURL: BASE_URL,
    // Every hidden starting state (opacity 0, clip-path, scroll-driven reveals) only exists under
    // `prefers-reduced-motion: no-preference`, so "reduce" renders the settled page: axe measures
    // final colors and clicks never wait on moving elements. `motion.spec.ts` opts back in.
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
});
