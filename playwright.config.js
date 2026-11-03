import { defineConfig } from "@playwright/test";

// End-to-end tests drive the REAL browser installed on this machine (Chrome), no browser download needed.
//
//   demo suite : storefront in sample/demo mode, no backend.      E2E_TARGET=demo
//   api suite  : storefront + admin against the live backend.      E2E_TARGET=api  (backend harness must be running)
//
// Build each variant first (see docs/TESTING.md):
//   NEXT_DIST_DIR=.next-demo npm run build
//   NEXT_DIST_DIR=.next-api NEXT_PUBLIC_DATA_SOURCE=api NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 NEXT_PUBLIC_SITE_URL=http://localhost:3400 npm run build
const target = process.env.E2E_TARGET || "demo";
const servers = {
  demo: { port: 3300, dist: ".next-demo", env: {} },
  api: { port: 3400, dist: ".next-api", env: { NEXT_PUBLIC_DATA_SOURCE: "api", NEXT_PUBLIC_API_URL: "http://localhost:4000/api/v1", NEXT_PUBLIC_SITE_URL: "http://localhost:3400" } },
};
const s = servers[target];

export default defineConfig({
  testDir: `e2e/${target}`,
  outputDir: "e2e/.output",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: { channel: "chrome", headless: true, baseURL: `http://localhost:${s.port}`, trace: "off", video: "off" },
  webServer: {
    command: `npx next start -p ${s.port}`,
    url: `http://localhost:${s.port}`,
    env: { NEXT_DIST_DIR: s.dist, ...s.env },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
