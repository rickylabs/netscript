# S0 worklog

## Design

1. Public surface: fresh-ui tokens:build/check, existing package tests, and a reusable Playwright test command documented in `tools/fresh-ui-browser/README.md`.
2. Domain vocabulary: design route, light/dark theme, viewport (390/1280), before baseline, axe violation, keyboard activation.
3. Ports: Deno CLI scaffold/task, Playwright Browser/Page/Test APIs, axe analysis, CI artifact upload; standard upstream APIs compose directly.
4. Constants: default route list, theme list, viewport widths, theme storage key, deterministic animation settings, serious/critical violation threshold (all other axe results retained).
5. Commit slices: plan/bootstrap; token hygiene with frozen build/check and package tests; browser harness/CI/baseline with browser and workflow gates; final reviewed evidence. Exact surfaces and gates are in plan.md.
6. Deferred scope: token redesign, docs redesign, backend changes, release/merge. They belong to later epic slices.
7. Contributor path: `tools/fresh-ui-browser/README.md` explains app/route configuration, baseline updates, results and extension.

## Routing override

Owner instruction verbatim: “Run PLAN-EVAL before implementing, and IMPL-EVAL after, both in the opposite family: claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts in the run dir.” Separate Anthropic evaluator sessions preserve independence.

## Bootstrap

- Feature routing query: exit 0.
- Issue/comments and covering-PR search: exit 0; no duplicate found.
- Memory consulted: environment tool-gap note; RTK unavailable.
- MCP guidance/search/export queries: exit 0 through repository stdio server.
- Fetched complete history and fast-forwarded to main before implementation. Baseline is now `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`.
- Reconcile: exact scope remains issue #2413. Owner forbids label changes. Final PR-body closing line follows delivery instructions, with Refs at the start.

## PLAN-EVAL round 1

FAIL_PLAN: baseline comparison policy was implicit; existing fresh-browser lane needed an explicit reuse decision; scaffold inputs and their asset gates were missing from browser workflow trigger scope. Fixed the plan once: S0 captures with no pixel-diff gate, baseline updates are explicit/reviewed, existing CLI probes remain, new harness uses freshUi, and scaffold/Fresh inputs trigger browser checks with conditional asset gates. Resumed the same evaluator for final PLAN-EVAL.

PLAN-EVAL round 2: PASS. Independent review confirms B1–B3 fixed; implementation may begin. Added the precise embedded-asset trigger path before implementation.

## Token slice

Frozen build and read-only token check both exit 0 with Style Dictionary 5.7.1. All three generated token artifacts are byte-identical to main; the builder intentionally emits original values, so the upstream duration transform change does not alter the current string easing/duration values.

The reviewed private-lock diff is 8 insertions / 5 deletions: Style Dictionary 5.4.4 becomes 5.7.1 with its Deno-resolved integrity; add lru-cache 11.5.1 using the already-reviewed root lock entry; route path-scurry 2.0.2 to 11.5.1 and preserve jsonld’s lru-cache 6.0.0. Deno’s update command alone retained the malformed edge, so that edge required explicit repair. No root lock change is retained.

Manual negative control: append a comment to tokens.css, invoke tokens:check: exit 1 and the edit remains intact. Restore exact bytes, invoke again: exit 0. Evidence: token-negative-control.json. Added isolated automated regression for edits and missing files across all three outputs, plus frozen reproduction.

Initial package checks (153 TS/TSX files), lint and scoped builder formatting: exit 0. Baseline full quality:gate: exit 0, with existing warnings retained. Package tests before the new regression: 186 passed. Final slice regression/check/evaluation pending.

### Token slice sign-off

Independent token-slice review: PASS (token-review.md). Incorporated the suggested stronger build assertion, then reran the isolated regression successfully.

| Command | Exit | Result |
| --- | --- | --- |
| `deno task --cwd packages/fresh-ui tokens:build` | 0 | Explicit frozen private lock; all three generated artifacts unchanged |
| `deno task --cwd packages/fresh-ui tokens:check` | 0 | Read-only comparison clean |
| `deno task --cwd packages/fresh-ui test --report-output ../../.llm/tmp/s0/token-tests.json` | 0 | 187 passed, 0 failed, 0 ignored |
| `deno task --cwd packages/fresh-ui check` | 0 | 154 source/test TypeScript files via structured wrapper |
| `deno task --cwd packages/fresh-ui lint` | 0 | 154 files via structured wrapper |
| Scoped `run-deno-fmt.ts` on builder and new test | 0 | Source formatting clean |
| `deno task quality:gate` | 0 | Existing warnings retained |
| `deno run --allow-read --allow-run .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh-ui --text` | 0 | No new publish surface; existing warnings |
| `deno publish --dry-run --allow-dirty` in fresh-ui | 0 | Package dry-run complete |
| `run-deno-doc-lint.ts --root packages/fresh-ui` | 1 | Supplemental existing interactive-surface documentation failures, unchanged by S0 |

Reconcile: no issue scope change, private lock only, no generated theme diff. Preserve independent browser lane and no-label owner override. Token slice terminal; next slice is browser harness/CI.

## Browser slice discoveries

All eight real gallery cases reached screenshots and passed keyboard activation. Existing serious/critical findings are contrast failures and tray-menu list/menu semantics. Independent policy review accepts an exact per-case multiset baseline as appropriate for unchanged S0 before evidence; requested stronger negative controls and explicit existing-debt reporting (browser-policy-round-1.md). This is not an axe-clean claim. No existing CI gate is weakened.

Full scaffold.runtime was invoked twice: first inherited local browser-library environment blocked narrow Deno subprocess permissions; rerun with clean environment exits 1 on Aspire doctor and reports Docker daemon unavailable. No runtime behavior gate is claimed green.

### Browser evidence

- Normal matrix: 8 passed, 0 failed, 0 skipped; captures and complete plain axe reports exist for both routes, both themes, both widths.
- Dated before capture: `npm run baseline` exits 0, 8 PNGs saved under `tools/fresh-ui-browser/baselines/2026-10-28-before/`; Chromium 153.0.8010.12, Playwright 1.63.0, axe-core 4.11.4. Mobile token capture visually inspected; gallery is the actual scaffold, with no product UI changes.
- Exact-baseline validator contract: 4 tests passed. Four deliberate browser controls each fail through the same validator (axe-negative-controls.json); combined command exits 1 as expected.
- Independent browser policy re-review: PASS after one correction (browser-policy-review.md). This records existing accessibility findings and is explicitly not axe-clean.
- Workflow/classifier/gate regression: 71 tests passed via structured wrapper.
- Tooling type-check: 7 TS files, exit 0 via structured wrapper in Node package cwd with `--no-config --no-lock --node-modules-dir=manual`.
- Tooling/source lint: exit 0, all 11 selected files processed. Root configuration excludes tools/.llm, so a temporary config copies the exact root lint rules with exclusions removed for this scoped check; no rules are disabled.
- The dedicated baseline contract uses `accessibility.contract.ts`, explicitly run after npm ci by its own gate. Standard root Deno shards do not need to install the separate Node browser toolchain.

Reconcile: no UI or scaffold template changes were necessary, so conditional asset regeneration gates remain not applicable. Main acceptance remains S0 token hygiene and reusable evidence. No existing CI gate is removed, labels unchanged. Full scaffold.runtime remains unproven locally due unavailable Docker/Aspire prerequisites.

## Final independent implementation evaluation

PASS at source head `958c2b5cb741152b6dd0ff488609e510445ce005`, separate Anthropic evaluator, high effort, read-only, stdin closed. No implementation repair requested. See evaluate.md. Durable source-head token freshness/build and browser receipts all PASS; gate-evidence.json is a privacy-safe index, not a substitute for native receipts. The browser receipt includes the fresh JSON domain report and 8 passed cases.

Final source and assignment-file exclusion verified. Remaining work is to mark the PR ready, verify the first remote dedicated workflow and its screenshot artifact, then publish the canonical READY file handoff. No merge/tag/release or label mutation is authorized.

## Review and CI follow-up

Augment suggestions #4397410788 and #4397410793 are valid and corrected. The recorder now derives the complete case/attachments suffix from each project’s original output directory; both a relocated-artifact fixture and the real downloaded CI artifact succeed. The keyboard test discards the initial storage seed and checks the intermediate persisted value after Enter as well as the final value after Space. Removing the copied component’s storage write now makes the real browser case fail with expected dark / received null; the component was restored before the positive matrix.

Corrected matrix: 8 passed. Exact validator/recorder contract: 5 passed. Type-check and lint: all selected files processed, exit 0. Aspire parity failure was a missing ownership classification for the maintained README; a scoped tooling-doc rule plus native manifest regeneration adds three real surface rows, without excluding content or changing version checks. Parity now passes (996 checked, 0 failures), and all 26 parity regression tests pass.

CI test-5’s sole failure was an unchanged generated-browser Chrome DevTools startup deadline. A local replay initially hit inherited-library-path permissions in its CLI fixture; replay with a browser-only executable wrapper keeps the Deno environment clean. Gate outcome is recorded when terminal. The original CI browser job already passed all eight cases; its downloaded artifact contains all eight PNGs and full reports. The original package quality workflow also completed successfully. Acceptance evidence/checklists were updated, and the close-gate checker passed live; rerunning the old CI job was rejected while its parent workflow remained active. The corrective push will run the live close-gate again.

Corrective implementation re-review: PASS in the same independent evaluator session (review-evaluation.md). No code repair requested. The previously failing generated-browser signin/provider/callback case passes locally with a browser-only library wrapper and the original deadline. The scan-scope regression suite also passes all 3 tests, proving the manifest gap behind test-6 is repaired. Test-6’s other packaged-binary compile failure is in unchanged source; targeted replay is in progress. New corrective-head CI proof remains pending and will not be claimed until its checks complete.
