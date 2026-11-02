# Mounted Northwind chat regression

This explicit browser gate mounts the emitted NorthwindChat island with the actual registry PromptInput, Markdown and ToolCallCard components. It uses the real generated chat handlers, ownership/origin guards, typed orders RPC and native durable streams host/store. Only server composition auth/provider ports are test fixtures; no demo identity is emitted in product templates. The fixture issues an opaque HTTP-only cookie and never accepts a browser-supplied subject.

From the repository root, install this worktree's tooling with the checked-in lock:

```sh
npm ci --ignore-scripts --prefix tools/fresh-ui-browser
```

If Chromium is absent, run `npx playwright install chromium` from tools/fresh-ui-browser. Install OS libraries through the normal worker setup, or supply an existing project-managed library directory through a process-only `LD_LIBRARY_PATH`. No global configuration or parent node_modules is used.

Run this gate locally or as an explicit CI step after the browser toolchain prerequisite:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- \
  --allow-all packages/cli/tests/showcase-ai/browser/showcase_ai_browser.ts
```

`SHOWCASE_AI_BROWSER_OUTPUT` optionally selects a private artifact directory for screenshots and browser-report.json; otherwise artifacts live in the test-owned temporary consumer and are cleaned up. The runner bundles current canonical sources every run, creates its own listeners and native file store, and closes only those resources and its per-test secret file. Public browser reports contain logical steps and booleans, not session IDs, cookies, credentials or absolute fixture paths.

`SHOWCASE_AI_BROWSER_SOURCE_REF=<full Git hash>` optionally renders only that immutable revision's island into the temporary consumer. This negative control never changes worktree source. The pre-repair baseline is `fdf51e27468fc496650154bba52d820c4572210e`; it must fail the same first-prompt readiness assertion. Omit this variable for the normal gate. Live resume offsets are compared to the exact preceding finite catch-up response header, rather than just checking that some offset exists.

The browser must create an empty thread and send its first prompt, reopen an unused thread and send, reload native messages/tool history without duplicates, and retain real origin/authentication denial. This is separate from the `showcase_ai_test.ts` 21-scenario source/stub gate (the original 20 plus chronological-list regression); both must pass. Parent CI/carrier integration remains parent-owned.
