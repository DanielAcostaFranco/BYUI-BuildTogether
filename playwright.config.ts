import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4174', port: 4174, reuseExistingServer: false },
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
