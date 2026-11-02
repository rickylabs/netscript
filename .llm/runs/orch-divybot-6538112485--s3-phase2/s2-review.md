PASS

The stale-bundle blocker is fixed, and I found no new blockers in the correction.

- **The suite now builds what it tests.**
  - The `webServer.command` in `gap.playwright.config.ts` runs `deno bundle` on `gap-fixture.tsx` first and only then starts `gap-server.ts`, joined with `&&`. A failed build means no server starts, so Playwright fails at startup.
  - With `reuseExistingServer: false`, Playwright won't attach to an existing server either.
  - Each run overwrites the bundle, so a green run always reflects the current `registry/components/ui` sources.
- **No dependency on run-specific files.**
  - `gap-server.ts` reads `test-results/gap-fixture.js` next to itself.
  - `test-results/` is git-ignored in `tools/fresh-ui-browser/.gitignore`.
  - The README now lists only the single Playwright command and says the bundle is rebuilt and overwritten on each run.
- **Your mutation check is good evidence.** You broke the roving-focus behaviour and the roving-selection case failed. That's the right negative test: changed source can no longer pass silently. I couldn't see the final 20-case run's result, so its pass/fail still needs to land in the slice evidence.

The non-blocking fixes are in place:
- The selected-item marker now applies to every ToggleGroup variant, matching the review render.
- ToggleGroup's JSDoc says it must be rendered inside a Fresh island to work.
- `registry.ts` no longer hard-codes an item count.

The installed-source test still compares against the current files, so the Toggle and ToggleGroup changes stay covered.