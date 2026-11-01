# Current docs browser verification

With pinned Playwright 1.63.0 / Chromium revision 1243, the full current docs matrix has 140 tests, not the older memories' 52 or 124. The suite passed all 140 in about 151 seconds, with zero skipped/flaky/failed tests. All 36 axe audits had zero serious or critical findings.

Use the fresh-ui-browser gate runner with cwd tools/fresh-ui-browser, child report test-results/docs/results.json and forwarded `-- --config docs.playwright.config.ts`. The gate runner's first `--` separates its own flags; the second supplies npm's `--`. It captures child output and emits a terminal receipt, so an empty redirected gate log while running is normal. Do not rebuild the site concurrently with the browser.

Project-owned unpacked Chromium libraries from the prior S8 docs run satisfy all dynamic library dependencies. Set LD_LIBRARY_PATH for the test process; no cache deletion or system package changes are necessary. Keep exact machine paths in private local evidence only.
