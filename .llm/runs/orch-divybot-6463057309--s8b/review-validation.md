# S8b review repair — 2026-10-28

This resumes PR #2437 from `660da01f`, preserving all scrub and acceptance-evidence commits. The three blocking findings and three polish requests are implemented without changes to shared site chrome, canonical prose, CI path filters or labels.

| Gate | Result | Evidence |
| --- | --- | --- |
| Three new negative tests before fix | Expected RED: exit 1, 0 passed / 3 failed; each “Missing expected exception” | review-negative-red.json |
| Same three negative tests after fix | PASS: exit 0, 3 passed / 0 failed | review-negative-green.json |
| Full generator fixture/corpus after fix | PASS: exit 0, 13 passed / 0 failed | review-tests-green.json |
| Root CI test bridge | PASS: exit 0, same substantive fixture/corpus suite | review-root-test-bridge.json |
| Scoped check / lint / format | PASS: six TS files, no findings | review-check.json, review-lint.json, review-fmt.json |
| Docs build | PASS: exit 0, 789 generated files / 251 HTML pages; source-format and rendered-output checks included | `deno task build` in docs/site |
| Built-site links | PASS: exit 0, 42,322 internal links resolve across 251 pages | `deno task check:links` in docs/site |
| Caveat references | PASS: exit 0, 15 markers across 12 pages | `deno task check:caveats` in docs/site |
| Exports drift | PASS: exit 0 | `deno task docs:exports-drift` at root |
| Documentation snippets | PASS: exit 0, 27 checked / 0 malformed | `deno task docs:snippets` at root |
| Broader quality scan | PASS: exit 0, no new allowances | review-quality-summary.json; private raw run-gate receipt |
| Browser | PASS: fixed TOC; CSS applies; all 68 gallery img elements use thumbnails and decode with exact declared dimensions; 390px and 1440px overflow checks | review-browser.json, screenshots/tonal--fixed-toc.png |
| Thumbnail output | PASS: 34 resized images, about 79% smaller in aggregate, zero committed thumbnails | review-thumbnail-audit.json |
| Full CLI E2E | UNPROVEN: exit 1, Aspire environment preflight failure before scaffolding; Docker unavailable for cleanup | review-e2e-summary.json |
| Resource inspection | Read-only; no mutations of foreign/unknown entries, counts only retained | review-resource-counts.json |

Commands at repository root:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --cwd docs/site -- --no-lock --allow-read --filter negative: _plugins/design-system/renderer-fixture.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --cwd docs/site -- --no-lock --allow-read _plugins/design-system/renderer-fixture.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --no-lock --allow-read --allow-run=deno docs/site/_plugins/design-system_test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --cwd docs/site --root _plugins --root design-system --include design-system --ext ts --deno-arg --no-lock
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --cwd docs/site --root _plugins --root design-system --include design-system --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --cwd docs/site --root _plugins --root design-system --include design-system --ext ts
deno task e2e:cli
```

The check wrapper includes --unstable-kv. JSON wrapper output is sanitized to relative paths for the public run record. The quality summary is explicitly a projection of the original private receipt, not a rewritten raw receipt. Gates ran with implementation present in the working tree; the summary identifies the precommit HEAD and does not claim clean-head attestation.

The existing tracked docs lock is preserved byte-for-byte after the build automatically adds graph entries for Lume’s pinned Sharp helper. No lock/cache deletion or reload occurred. No source image binaries were added. The required full runtime attempt is reported honestly and still requires a provisioned runner before merge; this run stops at READY for review.

Per-regression proof (same `--filter negative:` command, before and after):

| Test | Before | After |
| --- | --- | --- |
| Deleting a required theme section | RED — missing expected exception | GREEN — missing Colors rejected |
| Deleting a guidelines section | RED — missing expected exception | GREEN — missing section 5 rejected |
| Renaming a referenced guidelines heading | RED — missing expected exception | GREEN — renamed section 3 rejected |

Independent review: **PASS** with native Claude Opus 5.5 / high effort, read-only, stdin closed. The evaluator independently reran the 13-test fixture successfully and explicitly approved the substantive slice sign-off (`review-evaluate.md`, `review-evaluator-summary.json`). No blocking repair round required. Review-thread gate: **PASS**, 0 threads / 0 unanswered. Owned screenshot server stopped after capture; no foreign/unknown runtime mutation.
