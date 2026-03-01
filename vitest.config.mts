import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    // `forks` spawns child processes (not threads), so each fork has its own
    // V8 heap that is freed when the fork exits. V8 coverage collection works
    // natively in child processes and lcov.info is written correctly.
    //
    // Why not `vmThreads`? That pool writes raw per-worker V8 data to
    // coverage/.tmp/*.json but never completes the merge step, so lcov.info
    // is never written. The vmThreads pool is deprecated in Vitest v2.1+.
    //
    // Why not `threads`? The threads pool accumulates V8 coverage data across
    // all test files in a single worker heap. On macOS (lower default heap
    // ceiling) the heap fills during worker shutdown and triggers OOM. Setting
    // NODE_OPTIONS=--max-old-space-size does not reliably propagate to worker
    // thread heap limits in Vitest v4.
    //
    // Why not the default forks behaviour (one fork per file)? With 24+ files
    // each loading jsdom + V8 instrumentation the simultaneous RSS exceeds the
    // GitHub Actions 7 GB limit. Capping at 2 forks limits peak concurrency
    // to 2 child processes (≈ 1–2 GB RSS) while coverage aggregation in the
    // main process adds another ~200 MB.
    pool: "forks",
    maxWorkers: 2,
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    coverage: {
      provider: "v8",
      // The html reporter is memory-intensive and only useful for local browsing;
      // CI only needs lcov (SonarCloud), json-summary (thresholds), and text output.
      reporter: process.env.CI
        ? ["text", "json", "json-summary", "lcov"]
        : ["text", "json", "json-summary", "lcov", "html"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: [
        "node_modules/",
        ".next/",
        "vitest.config.mts",
        "vitest.setup.ts",
        "next.config.ts",
        "postcss.config.mjs",
        "commitlint.config.js",
        "stylelint.config.mjs",
        "src/app/layout.tsx",
        "src/types/dashboard.ts",
      ],
    },
  },
});
