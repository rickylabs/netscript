# Browser environment

This worker has Playwright Chromium 1248 in ~/.cache/ms-playwright, but no system Chrome dependencies. Existing project-local unpacked libraries work via LD_LIBRARY_PATH with both paths:
- $PROJECTS/runs/2026-10-28-netscript-s1/chromium-libs/usr/lib/x86_64-linux-gnu
- $PROJECTS/runs/2026-10-18-ledgerline-749/browser-libs (supplies libcups.so.2)

The existing playwright-core module is $PROJECTS/runs/2026-10-22-bench-site-3/shot/node_modules/playwright-core/index.mjs (v1.56.1). Set S8B_PLAYWRIGHT_MODULE to it and S8B_CHROMIUM_EXECUTABLE to ~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome when running capture.mjs. No package install or cache deletion needed. All inputs are read-only; browser scratch uses TMPDIR.
