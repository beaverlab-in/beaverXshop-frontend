// Builds the right storefront variant and runs the browser tests against it.
//   npm run e2e:demo   sample/demo mode, no backend needed
//   npm run e2e:api    storefront + admin against the live backend harness (start `npm run e2e:harness` in the backend repo first)
import { spawnSync } from "node:child_process";

const target = process.argv[2];
if (!["demo", "api"].includes(target)) {
  console.error("Usage: node scripts/e2e.mjs <demo|api>");
  process.exit(2);
}

const common = { ...process.env, E2E_TARGET: target };
const build =
  target === "demo"
    ? { NEXT_DIST_DIR: ".next-demo" }
    : { NEXT_DIST_DIR: ".next-api", NEXT_PUBLIC_DATA_SOURCE: "api", NEXT_PUBLIC_API_URL: "http://localhost:4000/api/v1", NEXT_PUBLIC_SITE_URL: "http://localhost:3400" };

if (target === "api") {
  try {
    const res = await fetch("http://localhost:4000/health/ready");
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    console.error("The backend harness isn't running on :4000. In beaverXshop-backend run: npm run e2e:harness");
    process.exit(2);
  }
}

const run = (args, env) => spawnSync(process.execPath, args, { stdio: "inherit", env: { ...common, ...env } }).status ?? 1;
console.log(`\n[e2e] building the ${target} variant…`);
if (run(["node_modules/next/dist/bin/next", "build"], build) !== 0) process.exit(1);
console.log(`\n[e2e] running browser tests (${target})…`);
process.exit(run(["node_modules/@playwright/test/cli.js", "test"], {}));
