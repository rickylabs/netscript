
## Target-selection delta evaluation (3b4e2b92b)

- Evaluator: Claude Fable 5.1, separate bounded IMPL-EVAL session (detached checkout, read-only).
- Scope: `git diff 257963e0c 3b4e2b92b` only ("test(cli): select the app page CDP target").
- Verdict: **PASS_IMPL**

### Findings

- INFO — `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts:928-935` — `selectPageDebugTarget` filters `/json/list` to `type === 'page'` with a string `webSocketDebuggerUrl`; the previous `find(entry => typeof entry.webSocketDebuggerUrl === 'string')` (which could pick `background_page` / `service_worker` targets) is gone. Strategy is now the same as `runtime/probe-island-hydration.ts:216-230` (`waitForPageTarget`), so the two probes cannot diverge on the hosted runner.
- INFO — `service-client-browser-probe.ts:938-952` and `:310-322` — `assertExpectedAppPage` runs right after `Page.loadEventFired` and rejects non-http(s) protocols or foreign origins with the captured `finalUrl` in the message, wrapped by `diagnosticsError` with the page-diagnostics snapshot. Fail-fast requirement met.
- INFO — Chrome is still launched with `about:blank` (`:260`), so a `page` target always exists; `waitUntil` blocks until one appears rather than attaching to whatever appears first.
- INFO — `assertSettledRefetch` is byte-identical between `257963e0c` and `3b4e2b92b` (diff of the function body is empty).
- INFO — Test `browser target selection ignores extension backgrounds and chooses the page` (`service-client-runtime-probe_test.ts:932-946`) pins a fake list with `chrome-extension://…/background.html` + page target, asserts page chosen and extension-only list returns `undefined`; origin-guard test at `:948-970`. Existing ordering tests (`:973`, `:1043`) untouched.
- No new `deno-lint-ignore`, `as unknown as`, or `any`. Touch set is exactly the two files; `deno.lock` unchanged; no product/template path.

### Evidence

| Command | Exit | Result |
| --- | --- | --- |
| `git diff --stat 257963e0c 3b4e2b92b` | 0 | 2 files, +95/-6; `deno.lock` diff empty |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 995 files, 9 batches, 0 failures |
| `TMPDIR=$HOME/tmp deno run … run-deno-test.ts -- --allow-all packages/cli/e2e/tests` (run 1) | 1 | 355 pass / 1 fail: `service-client-generated-format_test.ts:13` `NotFound … tmpdir` — unrelated file, not in delta |
| same test file in isolation | 0 | 1 passed |
| same full suite (run 2) | 0 | 356 pass / 0 fail |
| `deno task arch:check` | 0 | warnings only (pre-existing F-5/F-6 export-default) |
| `deno task quality:gate` | 0 | warnings only (pre-existing A13 / F-5/F-6) |

The run-1 failure is an environmental temp-dir race outside the evaluated delta; it is not attributed to this commit.
