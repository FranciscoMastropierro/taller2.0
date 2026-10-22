import { defineConfig } from "@playwright/test";
import { config } from "dotenv";
import { getDatabaseUrl } from "./src/server/env";
config({ path: ".env.local", quiet: true });
const database = getDatabaseUrl("TEST_DATABASE_URL");
if (!new URL(database).pathname.endsWith("_test")) throw new Error("E2E requiere base terminada en _test");
export default defineConfig({
  testDir: "./tests/e2e", workers: 1, retries: 0,
  use: { baseURL: "http://localhost:3100", browserName: "chromium", screenshot: "only-on-failure" },
  webServer: {
    command: "npm run dev -- --port 3100", url: "http://localhost:3100/ingresar", reuseExistingServer: false,
    env: { DATABASE_URL: database, AUTH_SECRET: "synthetic-playwright-auth-secret-only-for-tests", AUTH_URL: "http://localhost:3100" },
    timeout: 120000,
  },
});
